// lib/scraping/scrape-and-score.ts
// Main scraping workflow with delta calculation and scoring

import { Pool } from 'pg';
import { getApifyClient, TWITTER_SCRAPER_ACTOR_ID, ApifyTweetResult } from '../apify-client';
import { calculateDeltas, calculatePoints, isTweetActive } from './delta-calculator';
import { MockApifyClient, generateMockTweets } from '../mock-data-generator';
import { v4 as uuidv4 } from 'uuid';

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

interface Project {
  id: string;
  name: string;
  keywords: string[];
  cooldown_hours: number;
  status: string;
}

export async function scrapeAndScoreProject(
  projectId: string,
  dbPool: Pool
): Promise<{
  success: boolean;
  tweets_scraped: number;
  new_tweets: number;
  updated_tweets: number;
  points_awarded: number;
  error?: string;
}> {
  const scrapeSessionId = uuidv4();

  try {
    console.log(`\n🔍 Starting scrape for project ${projectId}...`);

    // Get project details
    const projectResult = await dbPool.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      throw new Error('Project not found');
    }

    const project: Project = projectResult.rows[0];

    if (project.status !== 'active') {
      throw new Error('Project is not active');
    }

    console.log(`📋 Project: ${project.name}`);
    console.log(`🔑 Keywords: ${project.keywords.join(', ')}`);

    if (USE_MOCK_DATA) {
      console.log(`🧪 DEVELOPMENT MODE - Using mock data`);
    }

    // Scrape tweets using Apify or mock data
    const tweets = await scrapeTweetsForProject(project);

    console.log(`📥 Scraped ${tweets.length} tweets`);

    // Get existing tweets that are less than 12 hours old to rescrape
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    const existingTweetsResult = await dbPool.query(`
      SELECT tweet_id, url FROM tweets
      WHERE project_id = $1
      AND posted_at > $2
      AND is_active = true
    `, [projectId, twelveHoursAgo]);

    const existingTweetIds = new Set(existingTweetsResult.rows.map(t => t.tweet_id));
    const scrapedTweetIds = new Set(tweets.map(t => t.id));

    // Find tweets to rescrape (exist in DB but not in new search results)
    const tweetsToRescrape = existingTweetsResult.rows.filter(
      t => !scrapedTweetIds.has(t.tweet_id)
    );

    console.log(`🔄 Found ${tweetsToRescrape.length} existing tweets to rescrape`);

    // Rescrape existing tweets by their URLs
    const rescrapedTweets = await rescrapeTweetsByUrl(tweetsToRescrape.map(t => t.url));

    console.log(`📥 Rescraped ${rescrapedTweets.length} existing tweets`);

    // Combine all tweets (new search results + rescraped existing tweets)
    const allTweets = [...tweets, ...rescrapedTweets];

    let newTweets = 0;
    let updatedTweets = 0;
    let totalPointsAwarded = 0;

    // Process each tweet
    for (const tweet of allTweets) {
      try {
        // Check if tweet is within 24 hours
        const postedAt = new Date(tweet.createdAt);
        const isActive = isTweetActive(postedAt);

        // Upsert user
        const userId = await upsertUser(tweet.author, dbPool);

        // Check if tweet exists
        const existingTweetResult = await dbPool.query(
          'SELECT * FROM tweets WHERE tweet_id = $1 AND project_id = $2',
          [tweet.id, projectId]
        );

        const currentMetrics = {
          likes: tweet.likeCount,
          retweets: tweet.retweetCount,
          replies: tweet.replyCount,
          quotes: tweet.quoteCount,
          bookmarks: tweet.bookmarkCount,
        };

        if (existingTweetResult.rows.length === 0) {
          // New tweet - award full points on first scrape
          console.log(`  ✨ New tweet ${tweet.id}`);

          const deltas = {
            likes_delta: currentMetrics.likes,
            retweets_delta: currentMetrics.retweets,
            replies_delta: currentMetrics.replies,
            quotes_delta: currentMetrics.quotes,
            bookmarks_delta: currentMetrics.bookmarks,
          };

          const points = calculatePoints(deltas);

          // Insert tweet
          await dbPool.query(`
            INSERT INTO tweets (
              tweet_id, project_id, user_id, text, url, posted_at,
              current_likes, current_retweets, current_replies,
              current_quotes, current_bookmarks,
              previous_likes, previous_retweets, previous_replies,
              previous_quotes, previous_bookmarks,
              is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING id
          `, [
            tweet.id, projectId, userId, tweet.text, tweet.url, postedAt,
            currentMetrics.likes, currentMetrics.retweets, currentMetrics.replies,
            currentMetrics.quotes, currentMetrics.bookmarks,
            0, 0, 0, 0, 0,  // previous metrics start at 0
            isActive
          ]);

          const tweetDbId = (await dbPool.query(
            'SELECT id FROM tweets WHERE tweet_id = $1 AND project_id = $2',
            [tweet.id, projectId]
          )).rows[0].id;

          // Award points
          await awardPoints(
            userId,
            projectId,
            tweetDbId,
            deltas,
            points,
            scrapeSessionId,
            dbPool
          );

          totalPointsAwarded += points.total_points;
          newTweets++;
        } else {
          // Existing tweet - calculate deltas
          const existingTweet = existingTweetResult.rows[0];

          // Only process if still active
          if (!isActive) {
            // Mark as inactive
            await dbPool.query(
              'UPDATE tweets SET is_active = false WHERE tweet_id = $1 AND project_id = $2',
              [tweet.id, projectId]
            );
            console.log(`  ⏰ Tweet ${tweet.id} is now inactive (>24h old)`);
            continue;
          }

          const previousMetrics = {
            likes: existingTweet.current_likes,
            retweets: existingTweet.current_retweets,
            replies: existingTweet.current_replies,
            quotes: existingTweet.current_quotes,
            bookmarks: existingTweet.current_bookmarks,
          };

          const deltas = calculateDeltas(currentMetrics, previousMetrics);
          const points = calculatePoints(deltas);

          // Update tweet with new metrics
          await dbPool.query(`
            UPDATE tweets SET
              current_likes = $1,
              current_retweets = $2,
              current_replies = $3,
              current_quotes = $4,
              current_bookmarks = $5,
              previous_likes = $6,
              previous_retweets = $7,
              previous_replies = $8,
              previous_quotes = $9,
              previous_bookmarks = $10,
              last_updated_at = NOW(),
              is_active = $11
            WHERE tweet_id = $12 AND project_id = $13
          `, [
            currentMetrics.likes, currentMetrics.retweets, currentMetrics.replies,
            currentMetrics.quotes, currentMetrics.bookmarks,
            previousMetrics.likes, previousMetrics.retweets, previousMetrics.replies,
            previousMetrics.quotes, previousMetrics.bookmarks,
            isActive,
            tweet.id, projectId
          ]);

          // Award points if there was growth
          if (points.total_points > 0) {
            await awardPoints(
              userId,
              projectId,
              existingTweet.id,
              deltas,
              points,
              scrapeSessionId,
              dbPool
            );

            totalPointsAwarded += points.total_points;
            console.log(`  📈 Updated tweet ${tweet.id} (+${points.total_points.toFixed(2)} pts)`);
          }

          updatedTweets++;
        }
      } catch (error) {
        console.error(`  ❌ Error processing tweet ${tweet.id}:`, error);
      }
    }

    // Update project scrape timestamps
    const nextScrapeAt = new Date();
    nextScrapeAt.setHours(nextScrapeAt.getHours() + project.cooldown_hours);

    await dbPool.query(`
      UPDATE projects SET
        last_scraped_at = NOW(),
        next_scrape_at = $1
      WHERE id = $2
    `, [nextScrapeAt, projectId]);

    console.log(`\n✅ Scrape complete!`);
    console.log(`   New tweets: ${newTweets}`);
    console.log(`   Updated tweets: ${updatedTweets}`);
    console.log(`   Points awarded: ${totalPointsAwarded.toFixed(2)}`);

    return {
      success: true,
      tweets_scraped: allTweets.length,
      new_tweets: newTweets,
      updated_tweets: updatedTweets,
      points_awarded: totalPointsAwarded,
    };
  } catch (error: any) {
    console.error('❌ Scrape failed:', error);
    return {
      success: false,
      tweets_scraped: 0,
      new_tweets: 0,
      updated_tweets: 0,
      points_awarded: 0,
      error: error.message,
    };
  }
}

async function scrapeTweetsForProject(project: Project): Promise<ApifyTweetResult[]> {
  if (USE_MOCK_DATA) {
    // Use mock data generator
    const mockClient = new MockApifyClient();
    return await mockClient.scrapeTweets(project.keywords, 100);
  }

  // Use real Apify
  const apifyClient = getApifyClient();

  // Create search terms with language filter
  const searchTerms = project.keywords.map(keyword => `${keyword} lang:en`);

  const run = await apifyClient.actor(TWITTER_SCRAPER_ACTOR_ID).call({
    searchTerms,
    maxItems: 100,  // Limit per scrape
    sort: 'Latest',
    tweetLanguage: 'en',
  });

  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

  return items as unknown as ApifyTweetResult[];
}

async function rescrapeTweetsByUrl(tweetUrls: string[]): Promise<ApifyTweetResult[]> {
  if (tweetUrls.length === 0) {
    return [];
  }

  if (USE_MOCK_DATA) {
    // In mock mode, return empty array for now
    // Could be enhanced to simulate updated metrics
    return [];
  }

  const apifyClient = getApifyClient();

  try {
    const run = await apifyClient.actor(TWITTER_SCRAPER_ACTOR_ID).call({
      urls: tweetUrls,
      maxItems: tweetUrls.length,
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    return items as unknown as ApifyTweetResult[];
  } catch (error) {
    console.error('❌ Error rescaping tweets by URL:', error);
    return [];
  }
}

async function upsertUser(
  author: ApifyTweetResult['author'],
  dbPool: Pool
): Promise<string> {
  const result = await dbPool.query(`
    INSERT INTO users (
      twitter_id, username, name, profile_picture,
      followers, is_verified, is_blue_verified
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (twitter_id) DO UPDATE SET
      username = EXCLUDED.username,
      name = EXCLUDED.name,
      profile_picture = EXCLUDED.profile_picture,
      followers = EXCLUDED.followers,
      is_verified = EXCLUDED.is_verified,
      is_blue_verified = EXCLUDED.is_blue_verified,
      updated_at = NOW()
    RETURNING id
  `, [
    author.id,
    author.userName,
    author.name,
    author.profilePicture,
    author.followers,
    author.isVerified,
    author.isBlueVerified,
  ]);

  return result.rows[0].id;
}

async function awardPoints(
  userId: string,
  projectId: string,
  tweetId: string,
  deltas: any,
  points: any,
  scrapeSessionId: string,
  dbPool: Pool
) {
  // Insert score history
  await dbPool.query(`
    INSERT INTO score_history (
      user_id, project_id, tweet_id,
      likes_delta, retweets_delta, replies_delta, quotes_delta, bookmarks_delta,
      points_from_likes, points_from_retweets, points_from_replies,
      points_from_quotes, points_from_bookmarks, total_points,
      scrape_session_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `, [
    userId, projectId, tweetId,
    deltas.likes_delta, deltas.retweets_delta, deltas.replies_delta,
    deltas.quotes_delta, deltas.bookmarks_delta,
    points.points_from_likes, points.points_from_retweets, points.points_from_replies,
    points.points_from_quotes, points.points_from_bookmarks, points.total_points,
    scrapeSessionId
  ]);

  // Update user project score
  await dbPool.query(`
    INSERT INTO user_project_scores (
      user_id, project_id, total_score, tweet_count, last_points_earned, last_earned_at
    ) VALUES ($1, $2, $3, 1, $3, NOW())
    ON CONFLICT (user_id, project_id) DO UPDATE SET
      total_score = user_project_scores.total_score + EXCLUDED.total_score,
      tweet_count = user_project_scores.tweet_count + 1,
      last_points_earned = EXCLUDED.total_score,
      last_earned_at = NOW(),
      updated_at = NOW()
  `, [userId, projectId, points.total_points]);
}
