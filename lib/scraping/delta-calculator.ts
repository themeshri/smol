// lib/scraping/delta-calculator.ts
// Calculates engagement deltas and points

// Points formula weights
const WEIGHTS = {
  likes: 1,
  retweets: 3,
  replies: 2,
  quotes: 3,
  bookmarks: 1.5,
};

export interface EngagementMetrics {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  bookmarks: number;
}

export interface EngagementDelta {
  likes_delta: number;
  retweets_delta: number;
  replies_delta: number;
  quotes_delta: number;
  bookmarks_delta: number;
}

export interface PointsBreakdown {
  points_from_likes: number;
  points_from_retweets: number;
  points_from_replies: number;
  points_from_quotes: number;
  points_from_bookmarks: number;
  total_points: number;
}

/**
 * Calculate deltas between current and previous engagement metrics
 * Ignores negative deltas (returns 0 instead)
 */
export function calculateDeltas(
  current: EngagementMetrics,
  previous: EngagementMetrics
): EngagementDelta {
  return {
    likes_delta: Math.max(0, current.likes - previous.likes),
    retweets_delta: Math.max(0, current.retweets - previous.retweets),
    replies_delta: Math.max(0, current.replies - previous.replies),
    quotes_delta: Math.max(0, current.quotes - previous.quotes),
    bookmarks_delta: Math.max(0, current.bookmarks - previous.bookmarks),
  };
}

/**
 * Calculate points from deltas using weighted formula
 * Formula: (likes_delta × 1) + (retweets_delta × 3) + (replies_delta × 2) +
 *          (quotes_delta × 3) + (bookmarks_delta × 1.5)
 */
export function calculatePoints(deltas: EngagementDelta): PointsBreakdown {
  const points_from_likes = deltas.likes_delta * WEIGHTS.likes;
  const points_from_retweets = deltas.retweets_delta * WEIGHTS.retweets;
  const points_from_replies = deltas.replies_delta * WEIGHTS.replies;
  const points_from_quotes = deltas.quotes_delta * WEIGHTS.quotes;
  const points_from_bookmarks = deltas.bookmarks_delta * WEIGHTS.bookmarks;

  const total_points =
    points_from_likes +
    points_from_retweets +
    points_from_replies +
    points_from_quotes +
    points_from_bookmarks;

  return {
    points_from_likes,
    points_from_retweets,
    points_from_replies,
    points_from_quotes,
    points_from_bookmarks,
    total_points,
  };
}

/**
 * Check if a tweet is still eligible for tracking (within 24 hours)
 */
export function isTweetActive(postedAt: Date): boolean {
  const now = new Date();
  const hoursSincePost = (now.getTime() - postedAt.getTime()) / (1000 * 60 * 60);
  return hoursSincePost <= 24;
}
