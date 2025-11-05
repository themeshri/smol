'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Pause, Plus, Users, MessageSquare, Clock, Loader2, TrendingUp } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  keywords: string[];
  cooldown_hours: number;
  status: string;
  last_scraped_at: string | null;
  next_scrape_at: string | null;
  participant_count: number;
  tweet_count: number;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [scrapingProjectId, setScrapingProjectId] = useState<string | null>(null);
  const [confirmScrapeProject, setConfirmScrapeProject] = useState<Project | null>(null);
  const [confirmToggleProject, setConfirmToggleProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    keywords: '',
    cooldown_hours: 24,
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    const keywords = formData.keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keywords.length === 0) {
      alert('Please enter at least one keyword');
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          keywords,
          cooldown_hours: formData.cooldown_hours,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateForm(false);
        setFormData({ name: '', keywords: '', cooldown_hours: 24 });
        fetchProjects();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    }
  };

  const toggleProjectStatus = async () => {
    if (!confirmToggleProject) return;

    const newStatus = confirmToggleProject.status === 'active' ? 'paused' : 'active';

    try {
      const res = await fetch(`/api/projects/${confirmToggleProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        fetchProjects();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project');
    } finally {
      setConfirmToggleProject(null);
    }
  };

  const triggerManualScrape = async () => {
    if (!confirmScrapeProject) return;

    setScrapingProjectId(confirmScrapeProject.id);
    setConfirmScrapeProject(null);

    try {
      const res = await fetch('/api/scrape/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: confirmScrapeProject.id }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchProjects();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error triggering scrape:', error);
      alert('Failed to trigger scrape');
    } finally {
      setScrapingProjectId(null);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="placeholder-glow">
            <span className="placeholder col-6" style={{ width: '200px', height: '40px' }}></span>
          </div>
          <div className="placeholder-glow">
            <span className="placeholder col-3" style={{ width: '120px', height: '40px' }}></span>
          </div>
        </div>
        <div className="row g-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="placeholder-glow">
                    <span className="placeholder col-8 mb-3"></span>
                    <span className="placeholder col-5"></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="display-5 fw-bold text-gradient mb-2">SMOL Projects</h1>
          <p className="text-muted fs-5">Track Twitter engagement growth by project</p>
        </div>
        <button
          className="btn btn-gradient btn-lg d-inline-flex align-items-center"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="me-2" size={20} />
          New Project
        </button>
      </div>

      <div className="row g-4">
        {projects.length === 0 ? (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-5 text-center text-muted">
                No projects yet. Create one to get started!
              </div>
            </div>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="col-12">
              <div className="card border-0 shadow-sm card-hover card-gradient-border">
                <div className="card-body p-4">
                  <div className="row align-items-start">
                    <div className="col-lg-8 mb-3 mb-lg-0">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <h3 className="h4 fw-bold mb-0">
                          <Link href={`/projects/${project.id}`} className="text-decoration-none text-primary">
                            {project.name}
                          </Link>
                        </h3>
                        <span className={`badge ${project.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                          {project.status === 'active' ? <><Play size={14} className="me-1" />Active</> : <><Pause size={14} className="me-1" />Paused</>}
                        </span>
                      </div>
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {project.keywords.map((keyword, idx) => (
                          <span key={idx} className="badge bg-light text-dark border">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="col-lg-4">
                      <div className="d-flex gap-2 justify-content-lg-end">
                        <button
                          onClick={() => setConfirmToggleProject(project)}
                          className={`btn ${project.status === 'active' ? 'btn-secondary' : 'btn-gradient'} btn-sm`}
                        >
                          {project.status === 'active' ? (
                            <><Pause className="me-1" size={14} />Pause</>
                          ) : (
                            <><Play className="me-1" size={14} />Resume</>
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmScrapeProject(project)}
                          className="btn btn-outline-primary btn-sm"
                          disabled={project.status === 'paused' || scrapingProjectId === project.id}
                        >
                          {scrapingProjectId === project.id ? (
                            <><Loader2 className="me-1 spinner-border spinner-border-sm" size={14} />Scraping...</>
                          ) : (
                            <><Play className="me-1" size={14} />Scrape Now</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="row g-4 mt-2">
                    <div className="col-6 col-lg-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center rounded-3" style={{
                          width: '3rem',
                          height: '3rem',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)',
                          boxShadow: '0 0.25rem 0.5rem rgba(59, 130, 246, 0.3)'
                        }}>
                          <Clock className="text-white" size={20} />
                        </div>
                        <div>
                          <p className="text-muted small mb-0">Cooldown</p>
                          <p className="fs-4 fw-bold mb-0">{project.cooldown_hours}h</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-lg-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center rounded-3" style={{
                          width: '3rem',
                          height: '3rem',
                          background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                          boxShadow: '0 0.25rem 0.5rem rgba(168, 85, 247, 0.3)'
                        }}>
                          <Users className="text-white" size={20} />
                        </div>
                        <div>
                          <p className="text-muted small mb-0">Participants</p>
                          <p className="fs-4 fw-bold mb-0">{project.participant_count}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-lg-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center rounded-3" style={{
                          width: '3rem',
                          height: '3rem',
                          background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                          boxShadow: '0 0.25rem 0.5rem rgba(34, 197, 94, 0.3)'
                        }}>
                          <MessageSquare className="text-white" size={20} />
                        </div>
                        <div>
                          <p className="text-muted small mb-0">Active Tweets</p>
                          <p className="fs-4 fw-bold mb-0">{project.tweet_count}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-lg-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center gradient-primary rounded-3 shadow-glow">
                          <div style={{ width: '3rem', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp className="text-white" size={20} />
                          </div>
                        </div>
                        <div>
                          <p className="text-muted small mb-0">Momentum</p>
                          <p className="fs-4 fw-bold text-primary mb-0">
                            {project.participant_count > 0 ? '↑' : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-muted small mt-3 d-flex align-items-center gap-2">
                    <Clock size={14} />
                    {project.last_scraped_at ? (
                      <>Last scraped: {new Date(project.last_scraped_at).toLocaleString()}</>
                    ) : (
                      <>Never scraped</>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateForm && (
        <>
          <div className="modal show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Create New Project</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCreateForm(false)}></button>
                </div>
                <form onSubmit={handleCreateProject}>
                  <div className="modal-body">
                    <p className="text-muted mb-4">Add a new project to track Twitter engagement. Enter the project name, keywords, and scraping interval.</p>
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label fw-semibold">Project Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        placeholder="e.g., Uranus Token Tracker"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="keywords" className="form-label fw-semibold">Keywords (comma-separated)</label>
                      <input
                        type="text"
                        className="form-control"
                        id="keywords"
                        placeholder="e.g., $uranus, uranus, #uranus"
                        value={formData.keywords}
                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                        required
                      />
                      <small className="text-muted">Separate keywords with commas</small>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="cooldown" className="form-label fw-semibold">Scrape Cooldown</label>
                      <select
                        className="form-select"
                        id="cooldown"
                        value={formData.cooldown_hours}
                        onChange={(e) => setFormData({ ...formData, cooldown_hours: parseInt(e.target.value) })}
                      >
                        <option value="1">1 hour</option>
                        <option value="6">6 hours</option>
                        <option value="12">12 hours</option>
                        <option value="24">24 hours</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Create Project</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      {/* Scrape Confirmation Modal */}
      {confirmScrapeProject && (
        <>
          <div className="modal show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Start Manual Scrape?</h5>
                  <button type="button" className="btn-close" onClick={() => setConfirmScrapeProject(null)}></button>
                </div>
                <div className="modal-body">
                  <p>This will trigger a scrape for <strong>{confirmScrapeProject.name}</strong> and may consume API credits. Are you sure you want to continue?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmScrapeProject(null)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={triggerManualScrape}>Start Scrape</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      {/* Toggle Status Confirmation Modal */}
      {confirmToggleProject && (
        <>
          <div className="modal show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {confirmToggleProject.status === 'active' ? 'Pause Project?' : 'Resume Project?'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setConfirmToggleProject(null)}></button>
                </div>
                <div className="modal-body">
                  <p>
                    {confirmToggleProject.status === 'active'
                      ? `Pausing "${confirmToggleProject.name}" will stop automatic scraping. You can resume it later.`
                      : `Resuming "${confirmToggleProject.name}" will restart automatic scraping based on the cooldown period.`
                    }
                  </p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmToggleProject(null)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={toggleProjectStatus}>
                    {confirmToggleProject.status === 'active' ? 'Pause' : 'Resume'}
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
