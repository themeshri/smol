-- SMOL Database Schema
-- Twitter Engagement Growth Tracker

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
-- Stores projects with keywords and scraping configuration
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  keywords TEXT[] NOT NULL,  -- Array of keywords to track
  cooldown_hours INTEGER NOT NULL CHECK (cooldown_hours IN (1, 6, 12, 24)),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  next_scrape_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
-- Stores Twitter user information
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  twitter_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  profile_picture VARCHAR(500),
  followers INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_blue_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tweets table
-- Stores tweets with current and previous engagement metrics for delta calculation
CREATE TABLE tweets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tweet_id VARCHAR(255) UNIQUE NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  url VARCHAR(500) NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Current engagement metrics
  current_likes INTEGER DEFAULT 0,
  current_retweets INTEGER DEFAULT 0,
  current_replies INTEGER DEFAULT 0,
  current_quotes INTEGER DEFAULT 0,
  current_bookmarks INTEGER DEFAULT 0,

  -- Previous engagement metrics (from last scrape)
  previous_likes INTEGER DEFAULT 0,
  previous_retweets INTEGER DEFAULT 0,
  previous_replies INTEGER DEFAULT 0,
  previous_quotes INTEGER DEFAULT 0,
  previous_bookmarks INTEGER DEFAULT 0,

  -- Tracking metadata
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,  -- False if tweet is >24h old

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User project scores table
-- Tracks total accumulated scores per user per project
CREATE TABLE user_project_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_score DECIMAL(12, 2) DEFAULT 0,
  tweet_count INTEGER DEFAULT 0,  -- Total number of tweets tracked
  last_points_earned DECIMAL(12, 2) DEFAULT 0,  -- Points from most recent scrape
  last_earned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, project_id)
);

-- Score history table
-- Detailed log of points earned over time with deltas
CREATE TABLE score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,

  -- Deltas that generated points
  likes_delta INTEGER DEFAULT 0,
  retweets_delta INTEGER DEFAULT 0,
  replies_delta INTEGER DEFAULT 0,
  quotes_delta INTEGER DEFAULT 0,
  bookmarks_delta INTEGER DEFAULT 0,

  -- Points breakdown
  points_from_likes DECIMAL(10, 2) DEFAULT 0,
  points_from_retweets DECIMAL(10, 2) DEFAULT 0,
  points_from_replies DECIMAL(10, 2) DEFAULT 0,
  points_from_quotes DECIMAL(10, 2) DEFAULT 0,
  points_from_bookmarks DECIMAL(10, 2) DEFAULT 0,
  total_points DECIMAL(10, 2) DEFAULT 0,

  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scrape_session_id UUID,  -- Group entries from same scrape run

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_next_scrape ON projects(next_scrape_at);

CREATE INDEX idx_users_twitter_id ON users(twitter_id);
CREATE INDEX idx_users_username ON users(username);

CREATE INDEX idx_tweets_project_id ON tweets(project_id);
CREATE INDEX idx_tweets_user_id ON tweets(user_id);
CREATE INDEX idx_tweets_tweet_id ON tweets(tweet_id);
CREATE INDEX idx_tweets_posted_at ON tweets(posted_at);
CREATE INDEX idx_tweets_is_active ON tweets(is_active);

CREATE INDEX idx_user_project_scores_user_id ON user_project_scores(user_id);
CREATE INDEX idx_user_project_scores_project_id ON user_project_scores(project_id);
CREATE INDEX idx_user_project_scores_total_score ON user_project_scores(total_score DESC);

CREATE INDEX idx_score_history_user_id ON score_history(user_id);
CREATE INDEX idx_score_history_project_id ON score_history(project_id);
CREATE INDEX idx_score_history_earned_at ON score_history(earned_at DESC);
CREATE INDEX idx_score_history_scrape_session ON score_history(scrape_session_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_project_scores_updated_at BEFORE UPDATE ON user_project_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
