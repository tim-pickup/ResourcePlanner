import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../store/theme';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const active = location.pathname === to || (to === '/projects' && location.pathname.startsWith('/projects'));
  return (
    <Link
      to={to}
      style={{
        fontSize: '13px',
        fontWeight: 510,
        color: active ? 'var(--c-text-1)' : 'var(--c-text-3)',
        textDecoration: 'none',
        padding: '4px 8px',
        borderRadius: '4px',
        background: active ? 'var(--c-active-bg)' : 'transparent',
      }}
      onMouseEnter={e => { if (!active) (e.target as HTMLElement).style.color = 'var(--c-text-2)'; }}
      onMouseLeave={e => { if (!active) (e.target as HTMLElement).style.color = 'var(--c-text-3)'; }}
    >
      {children}
    </Link>
  );
}

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/projects', label: 'Projects' },
  { to: '/resource-load', label: 'Resource Load' },
  { to: '/admin', label: 'Admin' },
];

export default function Header() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'var(--c-surface)',
      borderBottom: '1px solid var(--c-border-sm)',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      padding: '0 24px',
      height: '52px',
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '24px', height: '24px', borderRadius: '6px',
          background: '#5e6ad2', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="4" height="4" rx="1" fill="white" opacity="0.9"/>
            <rect x="7" y="1" width="4" height="4" rx="1" fill="white" opacity="0.6"/>
            <rect x="1" y="7" width="4" height="4" rx="1" fill="white" opacity="0.6"/>
            <rect x="7" y="7" width="4" height="4" rx="1" fill="white" opacity="0.3"/>
          </svg>
        </div>
        <span style={{ fontSize: '14px', fontWeight: 590, color: 'var(--c-text-1)', letterSpacing: '-0.02em' }}>
          Resource Planner
        </span>
      </Link>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
        {NAV_LINKS.map(l => (
          <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
        ))}
      </nav>

      {/* Dark / Light mode toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          background: 'var(--c-card-hover)',
          border: '1px solid var(--c-border)',
          borderRadius: '6px',
          padding: '5px 8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '12px',
          color: 'var(--c-text-3)',
          fontWeight: 510,
        }}
      >
        {isDark ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            Light
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            Dark
          </>
        )}
      </button>

      <button
        onClick={() => navigate('/projects/new')}
        style={{
          background: '#5e6ad2', color: '#fff', border: 'none',
          borderRadius: '6px', padding: '6px 14px', fontSize: '13px',
          fontWeight: 510, cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        + New Project
      </button>
    </header>
  );
}
