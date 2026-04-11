import { Link, useLocation, useNavigate } from 'react-router-dom';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const active = location.pathname === to || (to === '/projects' && location.pathname.startsWith('/projects'));
  return (
    <Link
      to={to}
      style={{
        fontSize: '13px',
        fontWeight: 510,
        color: active ? '#f7f8f8' : '#8a8f98',
        textDecoration: 'none',
        padding: '4px 8px',
        borderRadius: '4px',
        background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
      }}
      onMouseEnter={e => { if (!active) (e.target as HTMLElement).style.color = '#d0d6e0'; }}
      onMouseLeave={e => { if (!active) (e.target as HTMLElement).style.color = '#8a8f98'; }}
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
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: '#0f1011',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
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
        <span style={{ fontSize: '14px', fontWeight: 590, color: '#f7f8f8', letterSpacing: '-0.02em' }}>
          Resource Planner
        </span>
      </Link>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
        {NAV_LINKS.map(l => (
          <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
        ))}
      </nav>

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
