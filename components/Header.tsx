'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="navbar navbar-expand-lg sticky-top">
      <div className="container">
        <Link href="/" className="navbar-brand d-flex align-items-center">
          <div className="d-flex align-items-center justify-content-center gradient-primary rounded-3 shadow-glow me-2" style={{ width: '2.5rem', height: '2.5rem' }}>
            <TrendingUp className="text-white" size={18} />
          </div>
          <span className="fw-bold fs-4 text-gradient">SMOL</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link
                href="/"
                className={`nav-link px-3 rounded-3 ${isActive('/') && !isActive('/projects') ? 'bg-primary bg-opacity-10 text-primary fw-semibold' : ''}`}
              >
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/projects"
                className={`nav-link px-3 rounded-3 ${isActive('/projects') ? 'bg-primary bg-opacity-10 text-primary fw-semibold' : ''}`}
              >
                Projects
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
