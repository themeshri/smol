'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Trophy, Clock, Activity, Loader2 } from 'lucide-react';

interface User {
  user_id: string;
  twitter_id: string;
  username: string;
  name: string;
  profile_picture: string;
  followers: number;
  is_verified: boolean;
  is_blue_verified: boolean;
  total_score: number;
  tweet_count: number;
  last_points_earned: number;
  last_earned_at: string;
  rank: number;
}

interface Project {
  id: string;
  name: string;
  keywords: string[];
  cooldown_hours: number;
  status: string;
  last_scraped_at: string | null;
}

interface LeaderboardPageProps {
  params: Promise<{ id: string }>;
}

export default function LeaderboardPage({ params }: LeaderboardPageProps) {
  const { id: projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [showScrapeConfirm, setShowScrapeConfirm] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [projectId]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/leaderboard`);
      const data = await res.json();
      if (data.success) {
        setProject(data.project);
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerScrape = async () => {
    setShowScrapeConfirm(false);
    setIsScraping(true);
    try {
      const res = await fetch('/api/scrape/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchLeaderboard();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error triggering scrape:', error);
      alert('Failed to trigger scrape');
    } finally {
      setIsScraping(false);
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
            <div className="placeholder-glow">
              <span className="placeholder col-8 mb-3" style={{ height: '2rem' }}></span>
              <span className="placeholder col-5"></span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="placeholder-glow">
              <span className="placeholder col-12" style={{ height: '20rem' }}></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-5">
        <div className="card border-danger">
          <div className="card-body p-5 text-center text-danger">
            <h4>Project not found</h4>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="mb-4">
        <Link href="/projects" className="btn btn-link text-decoration-none d-inline-flex align-items-center">
          <ArrowLeft className="me-2" size={20} />
          Back to Projects
        </Link>
      </div>

      {/* Project Header Card */}
      <div className="card border-0 shadow-sm mb-4 overflow-hidden">
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)' }}></div>
        <div className="card-body p-4">
          <div className="row align-items-start">
            <div className="col-lg-8 mb-3 mb-lg-0">
              <h1 className="display-6 fw-bold text-gradient mb-3">{project.name}</h1>
              <div className="d-flex flex-wrap gap-2">
                {project.keywords.map((keyword, idx) => (
                  <span key={idx} className="badge bg-light text-dark border">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div className="col-lg-4 d-flex justify-content-lg-end">
              <button
                className="btn btn-gradient btn-lg d-inline-flex align-items-center"
                onClick={() => setShowScrapeConfirm(true)}
                disabled={project.status === 'paused' || isScraping}
              >
                {isScraping ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Scraping...
                  </>
                ) : (
                  <>
                    <Play className="me-2" size={20} />
                    Scrape Now
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="row g-4 mt-3">
            <div className="col-md-4">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-3" style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                  boxShadow: '0 0.25rem 0.5rem rgba(34, 197, 94, 0.3)'
                }}>
                  <Activity className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-muted small mb-1">Status</p>
                  <span className={`badge ${project.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                    {project.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-3" style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)',
                  boxShadow: '0 0.25rem 0.5rem rgba(59, 130, 246, 0.3)'
                }}>
                  <Clock className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-muted small mb-0">Cooldown</p>
                  <p className="display-6 fw-bold text-primary mb-0">{project.cooldown_hours}h</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-3" style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                  boxShadow: '0 0.5rem 1rem rgba(245, 158, 11, 0.3)'
                }}>
                  <Trophy className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-muted small mb-0">Last Scraped</p>
                  <p className="fw-semibold mb-0">
                    {project.last_scraped_at
                      ? new Date(project.last_scraped_at).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Card */}
      <div className="card border-0 shadow-sm overflow-hidden">
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)' }}></div>
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="d-flex align-items-center justify-content-center rounded-3" style={{
              width: '3.5rem',
              height: '3.5rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              boxShadow: '0 0.5rem 1rem rgba(245, 158, 11, 0.3)'
            }}>
              <Trophy className="text-white" size={24} />
            </div>
            <div>
              <h2 className="h3 fw-bold mb-0">Leaderboard</h2>
              <p className="text-muted mb-0">Top 100 users by total score</p>
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-5">
              <Trophy className="text-muted opacity-25 mb-3" size={64} />
              <p className="fs-5 text-muted">No participants yet. Run a scrape to populate the leaderboard.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="fw-bold" style={{ width: '100px' }}>Rank</th>
                    <th className="fw-bold">User</th>
                    <th className="fw-bold text-end">Total Score</th>
                    <th className="fw-bold text-end">Tweets</th>
                    <th className="fw-bold text-end">Last Earned</th>
                    <th className="fw-bold text-end">Followers</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((user) => (
                    <tr
                      key={user.user_id}
                      className={user.rank <= 3 ? 'bg-warning bg-opacity-10' : ''}
                    >
                      <td>
                        {user.rank === 1 ? (
                          <div className="text-center">
                            <div className="fs-1 animate-pulse">🥇</div>
                            <small className="fw-bold text-warning">1st</small>
                          </div>
                        ) : user.rank === 2 ? (
                          <div className="text-center">
                            <div className="fs-2">🥈</div>
                            <small className="fw-semibold text-secondary">2nd</small>
                          </div>
                        ) : user.rank === 3 ? (
                          <div className="text-center">
                            <div className="fs-2">🥉</div>
                            <small className="fw-semibold" style={{ color: '#cd7f32' }}>3rd</small>
                          </div>
                        ) : (
                          <span className="fs-5 fw-semibold text-muted">{user.rank}</span>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/users/${user.user_id}?project_id=${projectId}`}
                          className="text-decoration-none d-flex align-items-center gap-3"
                        >
                          <img
                            src={user.profile_picture}
                            alt={user.name}
                            className="avatar border border-2"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`;
                            }}
                          />
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold text-dark">{user.name}</span>
                              {user.is_verified && (
                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary" style={{ fontSize: '0.7rem' }}>✓</span>
                              )}
                              {user.is_blue_verified && (
                                <span className="badge bg-info bg-opacity-10 text-info border border-info" style={{ fontSize: '0.7rem' }}>✓</span>
                              )}
                            </div>
                            <small className="text-muted">@{user.username}</small>
                          </div>
                        </Link>
                      </td>
                      <td className="text-end">
                        <div>
                          <div className="display-6 fw-bold text-primary">{Number(user.total_score).toFixed(2)}</div>
                          <small className="text-muted">points</small>
                        </div>
                      </td>
                      <td className="text-end">
                        <span className="badge bg-secondary fs-6">{user.tweet_count}</span>
                      </td>
                      <td className="text-end">
                        <div>
                          <span className="badge bg-success fw-bold mb-1">
                            +{Number(user.last_points_earned).toFixed(2)}
                          </span>
                          <div>
                            <small className="text-muted">
                              {new Date(user.last_earned_at).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="text-end">
                        <span className="fw-semibold">{Number(user.followers).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Scrape Confirmation Modal */}
      {showScrapeConfirm && (
        <>
          <div className="modal show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Start Manual Scrape?</h5>
                  <button type="button" className="btn-close" onClick={() => setShowScrapeConfirm(false)}></button>
                </div>
                <div className="modal-body">
                  <p>
                    This will trigger a scrape for <strong>{project?.name}</strong> and may consume API credits.
                    The leaderboard will be automatically refreshed when complete.
                  </p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowScrapeConfirm(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={triggerScrape}>
                    Start Scrape
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}
    </div>
  );
}
