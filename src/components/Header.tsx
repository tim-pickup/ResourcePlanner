import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { UserRole } from '../types';

const ROLE_LABELS: Record<UserRole, string> = {
  project_lead: 'Project Lead',
  resource_manager: 'Resource Manager',
  prioritisation_board: 'Prioritisation Board',
  pmo_admin: 'PMO Admin',
};

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const active = location.pathname === to || location.hash === `#${to}`;
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
        transition: 'color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => { if (!active) (e.target as HTMLElement).style.color = '#d0d6e0'; }}
      onMouseLeave={e => { if (!active) (e.target as HTMLElement).style.color = '#8a8f98'; }}
    >
      {children}
    </Link>
  );
}

export default function Header() {
  const { currentRole, setRole } = useStore();

  const navLinks = (() => {
    switch (currentRole) {
      case 'project_lead':
        return [
          { to: '/', label: 'Dashboard' },
          { to: '/my-projects', label: 'My Projects' },
          { to: '/projects/new', label: 'New Project' },
        ];
      case 'resource_manager':
        return [
          { to: '/', label: 'Dashboard' },
          { to: '/review', label: 'Review Queue' },
          { to: '/my-projects', label: 'My Projects' },
          { to: '/projects/new', label: 'New Project' },
        ];
      case 'prioritisation_board':
        return [
          { to: '/', label: 'Dashboard' },
          { to: '/approval', label: 'Approval Queue' },
        ];
      case 'pmo_admin':
        return [
          { to: '/', label: 'Dashboard' },
          { to: '/review', label: 'Review Queue' },
          { to: '/admin', label: 'Admin' },
        ];
    }
  })();

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
      {/* Brand */}
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

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
        {navLinks.map(l => (
          <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
        ))}
      </nav>

      {/* Role selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#62666d', fontWeight: 510 }}>Role:</span>
        <select
          value={currentRole}
          onChange={e => setRole(e.target.value as UserRole)}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px',
            color: '#d0d6e0',
            fontSize: '12px',
            fontWeight: 510,
            padding: '4px 8px',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {(Object.keys(ROLE_LABELS) as UserRole[]).map(role => (
            <option key={role} value={role} style={{ background: '#191a1b' }}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
