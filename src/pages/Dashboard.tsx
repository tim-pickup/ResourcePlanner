import { useStore } from '../store';
import { ProjectStatus } from '../types';
import { formatWeekLabel } from '../utils/dates';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';

const STATUS_ORDER: ProjectStatus[] = ['draft','submitted','under_review','pending_approval','approved','rejected'];

const STATUS_META: Record<ProjectStatus, { label: string; color: string }> = {
  draft:            { label: 'Draft',            color: '#62666d' },
  submitted:        { label: 'Submitted',        color: '#5e6ad2' },
  under_review:     { label: 'Under Review',     color: '#f59e0b' },
  pending_approval: { label: 'Pending Approval', color: '#a855f7' },
  approved:         { label: 'Approved',         color: '#27a644' },
  rejected:         { label: 'Rejected',         color: '#ef4444' },
};

function StatCard({ status, count }: { status: ProjectStatus; count: number }) {
  const navigate = useNavigate();
  const { label, color } = STATUS_META[status];
  return (
    <button
      onClick={() => navigate(`/projects?status=${status}`)}
      style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px', padding: '16px 20px', cursor: 'pointer', textAlign: 'left',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
        (e.currentTarget as HTMLElement).style.borderColor = color + '55';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
      }}
    >
      <div style={{ fontSize: '28px', fontWeight: 590, color, letterSpacing: '-0.05em' }}>{count}</div>
      <div style={{ fontSize: '12px', color: '#8a8f98', fontWeight: 510, marginTop: '2px' }}>{label}</div>
    </button>
  );
}

const CUSTOM_TOOLTIP_STYLE = {
  background: '#191a1b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  fontSize: '12px',
  color: '#d0d6e0',
};

const THEME_COLORS: Record<string, { cap: string; demand: string; committed: string }> = {
  'theme-mom': { cap: '#5e6ad2', demand: '#a78bfa', committed: '#27a644' },
  'theme-miv': { cap: '#27a644', demand: '#4ade80', committed: '#f59e0b' },
};

function CapacityDemandChart() {
  const { engineers, demandRows, assignments, skills, themes } = useStore();

  const weekSet = new Set<string>();
  demandRows.forEach(r => r.weeklyHours.forEach(wh => weekSet.add(wh.weekCommencing)));
  const weeks = [...weekSet].sort();

  if (weeks.length === 0) return null;

  const activeThemes = themes.filter(t => t.isActive);
  if (activeThemes.length === 0) return null;

  const data = weeks.map(w => {
    const point: Record<string, string | number> = { week: formatWeekLabel(w) };
    activeThemes.forEach(theme => {
      const themeEngineers = engineers.filter(e => e.isActive && e.themeIds.includes(theme.id));
      const themeSkillIds = new Set(skills.filter(s => s.themeId === theme.id).map(s => s.id));
      const cap = themeEngineers.reduce((s, e) => s + e.weeklyCapacityHours, 0);
      const demand = demandRows
        .filter(r => themeSkillIds.has(r.skillId))
        .reduce((s, r) => s + (r.weeklyHours.find(h => h.weekCommencing === w)?.hours ?? 0), 0);
      const committed = assignments
        .filter(a => a.status === 'locked')
        .reduce((s, a) => {
          const dr = demandRows.find(r => r.id === a.demandRowId);
          if (!dr || !themeSkillIds.has(dr.skillId)) return s;
          return s + (a.weeklyHours.find(h => h.weekCommencing === w)?.hours ?? 0);
        }, 0);
      point[`${theme.id}_cap`] = cap;
      point[`${theme.id}_demand`] = demand;
      point[`${theme.id}_committed`] = committed;
    });
    return point;
  });

  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={sectionHead}>Capacity vs Demand Over Time</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {activeThemes.map(theme => {
          const colors = THEME_COLORS[theme.id] ?? { cap: '#5e6ad2', demand: '#f59e0b', committed: '#27a644' };
          return (
            <div key={theme.id} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', padding: '16px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 590, color: '#f7f8f8', marginBottom: '2px' }}>
                {theme.name} — Capacity vs Demand
              </div>
              <div style={{ fontSize: '11px', color: '#62666d', marginBottom: '12px' }}>
                Hours per week for this theme's engineers and projects
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#62666d' }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: '#62666d' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', color: '#8a8f98' }} />
                  <Line type="monotone" dataKey={`${theme.id}_cap`} name="Capacity (h)" stroke={colors.cap} strokeWidth={2} dot={false} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey={`${theme.id}_demand`} name="Demand (h)" stroke={colors.demand} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey={`${theme.id}_committed`} name="Committed (h)" stroke={colors.committed} strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { projects } = useStore();

  const counts: Record<ProjectStatus, number> = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = projects.filter(p => p.status === s).length;
    return acc;
  }, {} as Record<ProjectStatus, number>);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 590, color: '#f7f8f8', letterSpacing: '-0.03em', margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: '#8a8f98', margin: '4px 0 0' }}>
          Digital Manufacturing PMO — Resource Planning
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {STATUS_ORDER.map(s => <StatCard key={s} status={s} count={counts[s]} />)}
      </div>
      <p style={{ fontSize: '11px', color: '#62666d', marginBottom: '32px', marginTop: '-16px' }}>
        Click a counter to see projects in that state
      </p>

      <CapacityDemandChart />
    </div>
  );
}

const sectionHead: React.CSSProperties = {
  fontSize: '13px', fontWeight: 590, color: '#8a8f98',
  letterSpacing: '0.05em', textTransform: 'uppercase',
  margin: '0 0 12px',
};
