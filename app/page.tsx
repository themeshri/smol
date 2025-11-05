import Link from 'next/link';
import { TrendingUp, Clock, Trophy } from 'lucide-react';

export default function Home() {
  return (
    <div className="position-relative min-vh-100 overflow-hidden">
      {/* Animated gradient background */}
      <div className="position-absolute top-0 start-0 w-100 h-100" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(14, 165, 233, 0.05) 50%, transparent 100%)',
        zIndex: 0
      }} />

      {/* Animated orbs */}
      <div className="bg-orb bg-orb-primary animate-pulse" style={{
        top: '5rem',
        left: '-5rem',
        width: '18rem',
        height: '18rem'
      }} />
      <div className="bg-orb bg-orb-accent animate-pulse animation-delay-500" style={{
        bottom: '5rem',
        right: '-5rem',
        width: '24rem',
        height: '24rem'
      }} />

      <div className="container position-relative py-5" style={{ zIndex: 1 }}>
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {/* Hero section */}
            <div className="text-center mb-5 pb-5">
              <h1 className="display-1 fw-bold text-gradient mb-4 fade-in">
                SMOL
              </h1>
              <p className="fs-2 text-muted mb-4 fade-in animation-delay-150">
                Track Twitter Engagement Growth
              </p>
              <p className="fs-5 text-secondary mb-5 fade-in animation-delay-300" style={{ maxWidth: '42rem', margin: '0 auto' }}>
                Monitor projects by keywords. Score users based on engagement deltas.
                See who's gaining traction.
              </p>
              <div className="d-flex gap-3 justify-content-center fade-in animation-delay-500">
                <Link href="/projects" className="btn btn-gradient btn-lg d-inline-flex align-items-center">
                  View Projects
                  <TrendingUp className="ms-2" size={20} />
                </Link>
              </div>
            </div>

            {/* Feature cards */}
            <div className="row g-4">
              <div className="col-md-4">
                <div className="card border-0 shadow-sm card-hover h-100">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-center gradient-primary rounded-3 shadow-glow mb-4" style={{ width: '3.5rem', height: '3.5rem' }}>
                      <TrendingUp className="text-white" size={28} />
                    </div>
                    <h4 className="card-title fw-bold mb-3">Delta-Based Scoring</h4>
                    <p className="card-text text-secondary">
                      We track engagement growth, not absolute numbers. Get rewarded for momentum.
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 shadow-sm card-hover h-100">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-center rounded-3 shadow-glow-accent mb-4" style={{
                      width: '3.5rem',
                      height: '3.5rem',
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)'
                    }}>
                      <Clock className="text-white" size={28} />
                    </div>
                    <h4 className="card-title fw-bold mb-3">Automatic Tracking</h4>
                    <p className="card-text text-secondary">
                      Set cooldown periods (1h, 6h, 12h, 24h) and let the system scrape automatically.
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 shadow-sm card-hover h-100">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-center rounded-3 mb-4" style={{
                      width: '3.5rem',
                      height: '3.5rem',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                      boxShadow: '0 0.5rem 1rem rgba(245, 158, 11, 0.3)'
                    }}>
                      <Trophy className="text-white" size={28} />
                    </div>
                    <h4 className="card-title fw-bold mb-3">Project Leaderboards</h4>
                    <p className="card-text text-secondary">
                      See top performers per project with detailed score history and analytics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
