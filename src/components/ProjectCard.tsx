import { Project } from '../types';
import { useStore } from '../store';
import StatusBadge from './StatusBadge';
import { formatDateRange } from '../utils/dates';

interface Props {
  project: Project;
  onClick?: () => void;
  extra?: React.ReactNode;
}

export default function ProjectCard({ project, onClick, extra }: Props) {
  const { demandRows } = useStore();
  const rows = demandRows.filter(r => r.projectId === project.id);
  const totalHours = rows.reduce((sum, r) => sum + r.weeklyHours.reduce((s, wh) => s + wh.hours, 0), 0);

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px',
        padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '15px', fontWeight: 590, color: '#f7f8f8', letterSpacing: '-0.02em' }}>
              {project.name}
            </span>
            <StatusBadge status={project.status} size="sm" />
          </div>
          {project.description && (
            <p style={{ fontSize: '13px', color: '#8a8f98', margin: '0 0 8px', lineHeight: 1.5,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {project.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Meta label="Dates" value={formatDateRange(project.startDate, project.endDate)} />
            <Meta label="Funding" value={project.fundingType} />
            <Meta label="Total Hours" value={`${totalHours}h`} />
          </div>
        </div>
        {extra && <div>{extra}</div>}
      </div>
      {project.status === 'rejected' && project.rejectionReason && (
        <div style={{
          marginTop: '12px',
          padding: '10px 12px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#f87171',
        }}>
          <span style={{ fontWeight: 590 }}>Rejection reason: </span>
          {project.rejectionReason}
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: '11px', color: '#62666d', fontWeight: 510, display: 'block' }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#d0d6e0', fontWeight: 400 }}>{value}</span>
    </div>
  );
}
