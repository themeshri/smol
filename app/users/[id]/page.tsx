'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, Users, Trophy, TrendingUp, Heart, Repeat2, MessageCircle, Quote, Bookmark } from 'lucide-react';

interface User {
  id: string;
  twitter_id: string;
  username: string;
  name: string;
  profile_picture: string;
  followers: number;
  is_verified: boolean;
  is_blue_verified: boolean;
}

interface Project {
  id: string;
  name: string;
  keywords: string[];
}

interface Score {
  total_score: number;
  tweet_count: number;
  last_points_earned: number;
  last_earned_at: string | null;
}

interface HistoryEntry {
  id: string;
  tweet_text: string;
  tweet_url: string;
  posted_at: string;
  likes_delta: number;
  retweets_delta: number;
  replies_delta: number;
  quotes_delta: number;
  bookmarks_delta: number;
  points_from_likes: number;
  points_from_retweets: number;
  points_from_replies: number;
  points_from_quotes: number;
  points_from_bookmarks: number;
  total_points: number;
  earned_at: string;
}

interface Tweet {
  id: string;
  tweet_id: string;
  text: string;
  url: string;
  posted_at: string;
  current_likes: number;
  current_retweets: number;
  current_replies: number;
  current_quotes: number;
  current_bookmarks: number;
  likes_growth: number;
  retweets_growth: number;
  replies_growth: number;
}

interface UserPageProps {
  params: Promise<{ id: string }>;
}

export default function UserPage({ params }: UserPageProps) {
  const { id: userId } = use(params);
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');

  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchUserData();
    }
  }, [userId, projectId]);

  const fetchUserData = async () => {
    try {
      const res = await fetch(`/api/users/${userId}?project_id=${projectId}`);
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setProject(data.project);
        setScore(data.score);
        setHistory(data.history);
        setTweets(data.tweets);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="placeholder-glow mb-4">
          <span className="placeholder col-3" style={{ height: '2.5rem' }}></span>
        </div>
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex gap-4">
              <div className="placeholder-glow">
                <span className="placeholder rounded-circle" style={{ width: '6rem', height: '6rem' }}></span>
              </div>
              <div className="flex-grow-1 placeholder-glow">
                <span className="placeholder col-8 mb-3" style={{ height: '2rem' }}></span>
                <span className="placeholder col-5"></span>
              </div>
            </div>
          </div>
        </div>
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card">
              <div className="card-body placeholder-glow">
                <span className="placeholder col-12" style={{ height: '20rem' }}></span>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card">
              <div className="card-body placeholder-glow">
                <span className="placeholder col-12" style={{ height: '20rem' }}></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !project || !projectId) {
    return (
      <div className="container py-5">
        <div className="card border-danger">
          <div className="card-body p-5 text-center text-danger">
            <h4>User or project not found</h4>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="mb-4">
        <Link href={`/projects/${projectId}`} className="btn btn-link text-decoration-none d-inline-flex align-items-center">
          <ArrowLeft className="me-2" size={20} />
          Back to {project.name}
        </Link>
      </div>

      {/* User Profile Card */}
      <div className="card border-0 shadow-sm mb-4 overflow-hidden">
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)' }}></div>
        <div className="card-body p-4">
          <div className="row align-items-start">
            <div className="col-lg-8">
              <div className="d-flex gap-4 mb-4">
                <img
                  src={user.profile_picture}
                  alt={user.name}
                  className="avatar-lg border border-3 border-primary"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=128`;
                  }}
                />
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <h1 className="h2 fw-bold mb-0">{user.name}</h1>
                    {user.is_verified && (
                      <span className="badge bg-primary bg-opacity-10 text-primary border border-primary">✓</span>
                    )}
                    {user.is_blue_verified && (
                      <span className="badge bg-info bg-opacity-10 text-info border border-info">✓</span>
                    )}
                  </div>
                  <p className="text-muted fs-5 mb-3">@{user.username}</p>

                  <div className="row g-3">
                    <div className="col-6 col-md-3">
                      <div className="d-flex align-items-center gap-2">
                        <Users className="text-muted" size={20} />
                        <div>
                          <p className="text-muted small mb-0">Followers</p>
                          <p className="fs-5 fw-bold mb-0">{Number(user.followers).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="d-flex align-items-center gap-2">
                        <Trophy className="text-warning" size={20} />
                        <div>
                          <p className="text-muted small mb-0">Total Score</p>
                          <p className="fs-5 fw-bold text-primary mb-0">
                            {score ? Number(score.total_score).toFixed(2) : '0.00'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="d-flex align-items-center gap-2">
                        <MessageCircle className="text-info" size={20} />
                        <div>
                          <p className="text-muted small mb-0">Active Tweets</p>
                          <p className="fs-5 fw-bold mb-0">{score?.tweet_count || 0}</p>
                        </div>
                      </div>
                    </div>
                    {score?.last_earned_at && (
                      <div className="col-6 col-md-3">
                        <div className="d-flex align-items-center gap-2">
                          <TrendingUp className="text-success" size={20} />
                          <div>
                            <p className="text-muted small mb-0">Last Earned</p>
                            <p className="fs-5 fw-bold text-success mb-0">
                              +{Number(score.last_points_earned).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 d-flex justify-content-lg-end align-items-start">
              <a
                href={`https://twitter.com/${user.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary d-inline-flex align-items-center"
              >
                <ExternalLink className="me-2" size={18} />
                View on Twitter
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Active Tweets Card */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h3 className="h4 fw-bold mb-2">Active Tweets</h3>
              <p className="text-muted mb-4">Tweets from last 24 hours</p>

              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {tweets.length === 0 ? (
                  <p className="text-muted text-center py-5">No active tweets</p>
                ) : (
                  tweets.map((tweet, index) => (
                    <div key={tweet.id}>
                      <div className="p-3 rounded hover-bg-light transition">
                        <p className="mb-3">{tweet.text}</p>
                        <div className="d-flex gap-3 mb-2 small">
                          <span className="d-flex align-items-center gap-1 text-muted">
                            <Heart size={16} />
                            {tweet.current_likes}
                            {tweet.likes_growth > 0 && (
                              <span className="text-success ms-1">+{tweet.likes_growth}</span>
                            )}
                          </span>
                          <span className="d-flex align-items-center gap-1 text-muted">
                            <Repeat2 size={16} />
                            {tweet.current_retweets}
                            {tweet.retweets_growth > 0 && (
                              <span className="text-success ms-1">+{tweet.retweets_growth}</span>
                            )}
                          </span>
                          <span className="d-flex align-items-center gap-1 text-muted">
                            <MessageCircle size={16} />
                            {tweet.current_replies}
                            {tweet.replies_growth > 0 && (
                              <span className="text-success ms-1">+{tweet.replies_growth}</span>
                            )}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted small">
                            {new Date(tweet.posted_at).toLocaleString()}
                          </span>
                          <a
                            href={tweet.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-link d-inline-flex align-items-center"
                          >
                            View Tweet
                            <ExternalLink className="ms-1" size={12} />
                          </a>
                        </div>
                      </div>
                      {index < tweets.length - 1 && <hr className="my-2" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Score History Card */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h3 className="h4 fw-bold mb-2">Score History</h3>
              <p className="text-muted mb-4">Recent point earnings</p>

              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {history.length === 0 ? (
                  <p className="text-muted text-center py-5">No score history yet</p>
                ) : (
                  history.map((entry, index) => (
                    <div key={entry.id}>
                      <div className="p-3 rounded hover-bg-light transition">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="flex-grow-1 pe-3">
                            <p className="small mb-2" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {entry.tweet_text}
                            </p>
                            <div className="d-flex gap-2 mb-2 flex-wrap" style={{ fontSize: '0.75rem' }}>
                              {entry.likes_delta > 0 && (
                                <span className="d-flex align-items-center gap-1 text-muted">
                                  <Heart size={12} />
                                  +{entry.likes_delta}
                                </span>
                              )}
                              {entry.retweets_delta > 0 && (
                                <span className="d-flex align-items-center gap-1 text-muted">
                                  <Repeat2 size={12} />
                                  +{entry.retweets_delta}
                                </span>
                              )}
                              {entry.replies_delta > 0 && (
                                <span className="d-flex align-items-center gap-1 text-muted">
                                  <MessageCircle size={12} />
                                  +{entry.replies_delta}
                                </span>
                              )}
                              {entry.quotes_delta > 0 && (
                                <span className="d-flex align-items-center gap-1 text-muted">
                                  <Quote size={12} />
                                  +{entry.quotes_delta}
                                </span>
                              )}
                              {entry.bookmarks_delta > 0 && (
                                <span className="d-flex align-items-center gap-1 text-muted">
                                  <Bookmark size={12} />
                                  +{entry.bookmarks_delta}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-end">
                            <p className="fs-5 fw-bold text-success mb-0">
                              +{Number(entry.total_points).toFixed(2)}
                            </p>
                            <p className="text-muted small mb-0">
                              {(() => {
                                const now = new Date();
                                const earnedDate = new Date(entry.earned_at);
                                const diffMs = now.getTime() - earnedDate.getTime();
                                const diffMins = Math.floor(diffMs / 60000);
                                const diffHours = Math.floor(diffMins / 60);
                                const diffDays = Math.floor(diffHours / 24);

                                if (diffMins < 1) return 'Just now';
                                if (diffMins < 60) return `${diffMins}m ago`;
                                if (diffHours < 24) return `${diffHours}h ago`;
                                if (diffDays < 7) return `${diffDays}d ago`;
                                return earnedDate.toLocaleDateString();
                              })()}
                            </p>
                          </div>
                        </div>
                        <div className="d-flex gap-2 flex-wrap" style={{ fontSize: '0.75rem' }}>
                          {Number(entry.points_from_likes) > 0 && (
                            <span className="badge bg-danger bg-opacity-10 text-danger">
                              Likes: +{Number(entry.points_from_likes).toFixed(1)}
                            </span>
                          )}
                          {Number(entry.points_from_retweets) > 0 && (
                            <span className="badge bg-success bg-opacity-10 text-success">
                              RTs: +{Number(entry.points_from_retweets).toFixed(1)}
                            </span>
                          )}
                          {Number(entry.points_from_replies) > 0 && (
                            <span className="badge bg-primary bg-opacity-10 text-primary">
                              Replies: +{Number(entry.points_from_replies).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      {index < history.length - 1 && <hr className="my-2" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
