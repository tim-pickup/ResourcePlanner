import { ProjectStatus } from '../types';

const CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  draft:            { label: 'Draft',            color: '#62666d', bg: 'rgba(98,102,109,0.15)' },
  submitted:        { label: 'Submitted',        color: '#5e6ad2', bg: 'rgba(94,106,210,0.15)' },
  under_review:     { label: 'Under Review',     color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  pending_approval: { label: 'Pending Approval', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  approved:         { label: 'Approved',         color: '#27a644', bg: 'rgba(39,166,68,0.15)'  },
  rejected:         { label: 'Rejected',         color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
};

interface Props {
  status: ProjectStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const { label, color, bg } = CONFIG[status];
  const px = size === 'sm' ? '6px' : '8px';
  const py = size === 'sm' ? '2px' : '3px';
  const fs = size === 'sm' ? '11px' : '12px';

  return (
    <span style={{
      display: 'inline-block',
      padding: `${py} ${px}`,
      borderRadius: '9999px',
      fontSize: fs,
      fontWeight: 510,
      color,
      background: bg,
      border: `1px solid ${color}30`,
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}
