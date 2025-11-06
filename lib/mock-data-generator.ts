// Mock data generator for development without Apify
import { ApifyTweetResult } from './apify-client';

const SAMPLE_AUTHORS = [
  {
    id: '1234567890',
    userName: 'crypto_whale',
    name: 'Crypto Whale 🐋',
    profilePicture: 'https://ui-avatars.com/api/?name=Crypto+Whale&background=6366f1&color=fff',
    followers: 15000,
    isVerified: false,
    isBlueVerified: true,
  },
  {
    id: '2345678901',
    userName: 'blockchain_dev',
    name: 'BlockchainDev',
    profilePicture: 'https://ui-avatars.com/api/?name=BlockchainDev&background=0ea5e9&color=fff',
    followers: 8500,
    isVerified: true,
    isBlueVerified: false,
  },
  {
    id: '3456789012',
    userName: 'defi_trader',
    name: 'DeFi Trader',
    profilePicture: 'https://ui-avatars.com/api/?name=DeFi+Trader&background=22c55e&color=fff',
    followers: 25000,
    isVerified: false,
    isBlueVerified: false,
  },
  {
    id: '4567890123',
    userName: 'web3_builder',
    name: 'Web3 Builder 🛠️',
    profilePicture: 'https://ui-avatars.com/api/?name=Web3+Builder&background=f59e0b&color=fff',
    followers: 12000,
    isVerified: false,
    isBlueVerified: true,
  },
  {
    id: '5678901234',
    userName: 'nft_collector',
    name: 'NFT Collector',
    profilePicture: 'https://ui-avatars.com/api/?name=NFT+Collector&background=ec4899&color=fff',
    followers: 5000,
    isVerified: false,
    isBlueVerified: false,
  },
];

const SAMPLE_TWEET_TEMPLATES = [
  'Just discovered {keyword}! This is going to be huge 🚀',
  '{keyword} is absolutely crushing it today! The momentum is real 📈',
  'Why is nobody talking about {keyword}? This is the future of crypto 💎',
  'Been researching {keyword} all week. Here\'s what I found... 🧵',
  '{keyword} community is the most supportive in crypto! Love you all ❤️',
  'If you\'re not paying attention to {keyword}, you\'re ngmi 🤷',
  'Just bought more {keyword}. DCA is the way 💪',
  '{keyword} ecosystem is growing faster than I expected 🌱',
  'Hot take: {keyword} will 10x from here. Don\'t say I didn\'t warn you 🔥',
  'The {keyword} roadmap is insane. Q2 is going to be wild 🎯',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateTweetText(keywords: string[]): string {
  const keyword = randomElement(keywords);
  const template = randomElement(SAMPLE_TWEET_TEMPLATES);
  return template.replace('{keyword}', keyword);
}

function generateTweetId(): string {
  return Date.now().toString() + randomInt(1000, 9999).toString();
}

export function generateMockTweets(
  keywords: string[],
  count: number = 20
): ApifyTweetResult[] {
  const tweets: ApifyTweetResult[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const author = randomElement(SAMPLE_AUTHORS);
    const tweetId = generateTweetId();
    const text = generateTweetText(keywords);

    // Generate tweets within last 24 hours
    const hoursAgo = Math.random() * 24;
    const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    // Generate realistic engagement metrics
    const baseLikes = randomInt(5, 500);
    const baseRetweets = Math.floor(baseLikes * 0.3);
    const baseReplies = Math.floor(baseLikes * 0.2);
    const baseQuotes = Math.floor(baseLikes * 0.1);
    const baseBookmarks = Math.floor(baseLikes * 0.15);

    tweets.push({
      id: tweetId,
      url: `https://twitter.com/${author.userName}/status/${tweetId}`,
      text,
      author,
      createdAt: createdAt.toISOString(),
      likeCount: baseLikes,
      retweetCount: baseRetweets,
      replyCount: baseReplies,
      quoteCount: baseQuotes,
      bookmarkCount: baseBookmarks,
    });
  }

  return tweets;
}

export function generateMockTweetUpdates(
  existingTweet: ApifyTweetResult,
  growthMultiplier: number = 1.2
): ApifyTweetResult {
  // Simulate engagement growth
  return {
    ...existingTweet,
    likeCount: Math.floor(existingTweet.likeCount * growthMultiplier) + randomInt(1, 10),
    retweetCount: Math.floor(existingTweet.retweetCount * growthMultiplier) + randomInt(0, 5),
    replyCount: Math.floor(existingTweet.replyCount * growthMultiplier) + randomInt(0, 3),
    quoteCount: Math.floor(existingTweet.quoteCount * growthMultiplier) + randomInt(0, 2),
    bookmarkCount: Math.floor(existingTweet.bookmarkCount * growthMultiplier) + randomInt(0, 5),
  };
}

// Mock Apify client that returns generated data
export class MockApifyClient {
  async scrapeTweets(keywords: string[], maxItems: number = 100): Promise<ApifyTweetResult[]> {
    console.log('🧪 Using MOCK Apify client (development mode)');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    return generateMockTweets(keywords, Math.min(maxItems, 20));
  }

  async scrapeTweetsByUrl(urls: string[]): Promise<ApifyTweetResult[]> {
    console.log('🧪 Using MOCK Apify client for URL scraping');
    await new Promise(resolve => setTimeout(resolve, 500));

    // For now, return empty array - in real usage, these would be updated versions
    // of existing tweets with higher engagement metrics
    return [];
  }
}
