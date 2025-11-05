// lib/scraping/apify-client.ts
import { ApifyClient } from 'apify-client';

// Lazy initialization to ensure env vars are loaded
let _apifyClient: ApifyClient | null = null;

export function getApifyClient(): ApifyClient {
  if (!_apifyClient) {
    const token = process.env.APIFY_API_TOKEN || 'placeholder-token';
    _apifyClient = new ApifyClient({ token });
  }
  return _apifyClient;
}

// For backwards compatibility
export const apifyClient = new Proxy({} as ApifyClient, {
  get(target, prop) {
    return (getApifyClient() as any)[prop];
  }
});

// Tweet Scraper V2 Actor ID - Your existing actor
// Fast and cost-effective Twitter scraper ($0.30 per 1000 tweets)
export const TWITTER_SCRAPER_ACTOR_ID = '61RPP7dywgiy0JPD0';

// Input configuration for Tweet Scraper V2
export interface TwitterScraperInput {
  searchTerms: string[];                 // Required: search terms/keywords
  maxItems?: number;                     // Optional: max total tweets (default: 1000)
  sort?: 'Latest' | 'Top';               // Optional: sort order (default: 'Latest')
  tweetLanguage?: string;                // Optional: language filter (e.g., 'en')
  minimumRetweets?: number;              // Optional: min retweets filter
  minimumFavorites?: number;             // Optional: min likes filter
  minimumReplies?: number;               // Optional: min replies filter
  start?: string;                        // Optional: start date (YYYY-MM-DD)
  end?: string;                          // Optional: end date (YYYY-MM-DD)
  includeSearchTerms?: boolean;          // Optional: include search term in output
}

// Output format from Tweet Scraper V2
export interface ApifyTweetResult {
  type: 'tweet';
  id: string;                            // Unique tweet ID
  url: string;                           // Tweet URL
  twitterUrl: string;                    // Alternative Twitter URL
  text: string;                          // Tweet text content
  retweetCount: number;                  // Number of retweets
  replyCount: number;                    // Number of replies
  likeCount: number;                     // Number of likes (favorites)
  quoteCount: number;                    // Number of quote tweets
  bookmarkCount: number;                 // Number of bookmarks
  createdAt: string;                     // Tweet creation date
  lang: string;                          // Tweet language
  isReply: boolean;                      // Is this a reply?
  isRetweet: boolean;                    // Is this a retweet?
  isQuote: boolean;                      // Is this a quote tweet?
  author: {                              // Author information
    type: 'user';
    userName: string;                    // Username (handle)
    name: string;                        // Display name
    id: string;                          // User ID
    url: string;                         // User profile URL
    isVerified: boolean;                 // Legacy verified
    isBlueVerified: boolean;             // Twitter Blue verified
    verifiedType?: string;               // Verification type
    hasNftAvatar: boolean;               // Has NFT avatar
    profilePicture: string;              // Profile picture URL
    coverPicture?: string;               // Cover/banner image
    description: string;                 // Bio/description
    location: string;                    // Location
    followers: number;                   // Follower count
    following: number;                   // Following count
    protected: boolean;                  // Is account protected
    createdAt: string;                   // Account creation date
    statusesCount: number;               // Total tweets
  };
  extendedEntities?: {                   // Media entities
    media?: Array<{
      type: string;                      // 'photo' | 'video' | 'animated_gif'
      media_url_https: string;           // Media URL
      url: string;                       // Short URL
      display_url: string;               // Display URL
      video_info?: {                     // Video info (if video)
        variants: Array<{
          url: string;
          content_type: string;
          bitrate?: number;
        }>;
      };
    }>;
  };
  searchTerm?: string;                   // Search term that found this tweet (if includeSearchTerms: true)
}
