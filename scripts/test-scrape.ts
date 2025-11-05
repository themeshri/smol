// scripts/test-scrape.ts
// Test the scraping workflow

import { getPool } from '../lib/pool';
import { scrapeAndScoreProject } from '../lib/scraping/scrape-and-score';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testScrape() {
  const pool = getPool();

  try {
    // Get the most recent project
    const result = await pool.query(`
      SELECT * FROM projects
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      console.log('❌ No active projects found. Run create-test-project.ts first.');
      return;
    }

    const project = result.rows[0];
    console.log(`\n🎯 Testing scrape for: ${project.name}`);
    console.log(`📋 Project ID: ${project.id}`);
    console.log(`🔑 Keywords: ${project.keywords.join(', ')}\n`);

    // Run scrape
    const scrapeResult = await scrapeAndScoreProject(project.id, pool);

    console.log('\n' + '='.repeat(60));
    console.log('📊 SCRAPE RESULTS');
    console.log('='.repeat(60));
    console.log(`Success: ${scrapeResult.success}`);
    console.log(`Tweets scraped: ${scrapeResult.tweets_scraped}`);
    console.log(`New tweets: ${scrapeResult.new_tweets}`);
    console.log(`Updated tweets: ${scrapeResult.updated_tweets}`);
    console.log(`Points awarded: ${scrapeResult.points_awarded.toFixed(2)}`);

    if (scrapeResult.error) {
      console.log(`Error: ${scrapeResult.error}`);
    }

    // Show leaderboard preview
    console.log('\n' + '='.repeat(60));
    console.log('🏆 TOP 5 LEADERBOARD');
    console.log('='.repeat(60));

    const leaderboard = await pool.query(`
      SELECT
        u.username,
        u.name,
        ups.total_score,
        ups.tweet_count
      FROM user_project_scores ups
      JOIN users u ON ups.user_id = u.id
      WHERE ups.project_id = $1
      ORDER BY ups.total_score DESC
      LIMIT 5
    `, [project.id]);

    if (leaderboard.rows.length === 0) {
      console.log('No users yet.\n');
    } else {
      leaderboard.rows.forEach((user, idx) => {
        console.log(`${idx + 1}. @${user.username} - ${parseFloat(user.total_score).toFixed(2)} pts (${user.tweet_count} tweets)`);
      });
      console.log('');
    }

    console.log('✨ Test complete!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testScrape();
