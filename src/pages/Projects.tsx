import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { ProjectStatus } from '../types';

const STATUS_META: Record<ProjectStatus, { label: string; color: string }> = {
  draft:            { label: 'Draft',            color: '#62666d' },
  submitted:        { label: 'Submitted',        color: '#5e6ad2' },
  under_review:     { label: 'Under Review',     color: '#f59e0b' },
  pending_approval: { label: 'Pending Approval', color: '#a855f7' },
  approved:         { label: 'Approved',         color: '#27a644' },
  rejected:         { label: 'Rejected',         color: '#ef4444' },
};

const ALL_STATUSES: ProjectStatus[] = ['draft','submitted','under_review','pending_approval','approved','rejected'];

export default function Projects() {
  const { projects } = useStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const activeStatus = (params.get('status') as ProjectStatus | null) ?? 'all';

  const filtered = activeStatus === 'all'
    ? projects
    : projects.filter(p => p.status === activeStatus);

  const sorted = [...filtered].sort((a, b) =>
    (b.submittedAt ?? b.startDate).localeCompare(a.submittedAt ?? a.startDate)
  );

  function handleClick(id: string, status: ProjectStatus) {
    if (status === 'submitted' || status === 'under_review') navigate(`/review/${id}`);
    else if (status === 'pending_approval') navigate(`/approval/${id}`);
    else if (status === 'draft') navigate(`/projects/new?id=${id}`);
  }

  const title = activeStatus === 'all'
    ? 'All Projects'
    : `${STATUS_META[activeStatus as ProjectStatus].label} Projects`;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => navigate('/')} style={backBtn}>← Dashboard</button>
        <h1 style={h1}>{title}</h1>
        <p style={sub}>{sorted.length} project{sorted.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <FilterTab label="All" active={activeStatus === 'all'} count={projects.length} color="#8a8f98" onSelect={() => setParams({})} />
        {ALL_STATUSES.map(s => (
          <FilterTab
            key={s}
            label={STATUS_META[s].label}
            active={activeStatus === s}
            count={projects.filter(p => p.status === s).length}
            color={STATUS_META[s].color}
            onSelect={() => setParams({ status: s })}
          />
        ))}
      </div>

      {sorted.length === 0 && (
        <div style={{ color: '#62666d', fontSize: '14px', padding: '32px 0' }}>
          No projects with this status.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sorted.map(p => {
          const meta = STATUS_META[p.status];
          const isClickable = ['submitted','under_review','pending_approval','draft'].includes(p.status);
          return (
            <div
              key={p.id}
              onClick={isClickable ? () => handleClick(p.id, p.status) : undefined}
              style={{
                background: 'var(--c-card)', border: '1px solid var(--c-border)',
                borderRadius: '8px', padding: '14px 16px',
                cursor: isClickable ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (isClickable) (e.currentTarget as HTMLElement).style.background = 'var(--c-card-hover)'; }}
              onMouseLeave={e => { if (isClickable) (e.currentTarget as HTMLElement).style.background = 'var(--c-card)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 510, color: 'var(--c-text-1)', marginBottom: '4px' }}>{p.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text-4)' }}>
                    {p.startDate} – {p.endDate}
                    {p.phases.length === 1
                      ? ` · ${p.phases[0].fundingType}`
                      : p.phases.length > 1
                      ? ` · ${p.phases.length} phases (${p.phases.map(ph => ph.fundingType.replace(' Funded','').replace('Group Strategy','Group')).join(', ')})`
                      : ''}
                  </div>
                  {p.rejectionReason && (
                    <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>
                      Rejected: {p.rejectionReason}
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 590, padding: '3px 8px', borderRadius: '4px',
                  background: meta.color + '22', color: meta.color, whiteSpace: 'nowrap',
                }}>
                  {meta.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterTab({ label, active, count, color, onSelect }: {
  label: string; active: boolean; count: number; color: string; onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        background: active ? color + '22' : 'var(--c-card-sm)',
        border: `1px solid ${active ? color + '55' : 'var(--c-border)'}`,
        borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
        fontSize: '12px', fontWeight: 510,
        color: active ? color : 'var(--c-text-3)',
        transition: 'all 0.15s',
      }}
    >
      {label} <span style={{ opacity: 0.7 }}>({count})</span>
    </button>
  );
}

const h1: React.CSSProperties = { fontSize: '24px', fontWeight: 590, color: 'var(--c-text-1)', letterSpacing: '-0.03em', margin: '4px 0' };
const sub: React.CSSProperties = { fontSize: '13px', color: 'var(--c-text-3)', margin: 0 };
const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--c-text-4)', fontSize: '13px', cursor: 'pointer', padding: '0 0 8px', display: 'block' };
