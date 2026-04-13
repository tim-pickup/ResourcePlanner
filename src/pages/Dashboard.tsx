import { useStore } from '../store';
import { ProjectStatus } from '../types';
import { formatWeekLabel } from '../utils/dates';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useTheme, getChartColors } from '../store/theme';
import { CHART_LINE_COLORS } from '../utils/chartColors';

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
        background: 'var(--c-card)', border: '1px solid var(--c-border)',
        borderRadius: '8px', padding: '16px 20px', cursor: 'pointer', textAlign: 'left',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'var(--c-card-hover)';
        (e.currentTarget as HTMLElement).style.borderColor = color + '55';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'var(--c-card)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border)';
      }}
    >
      <div style={{ fontSize: '28px', fontWeight: 590, color, letterSpacing: '-0.05em' }}>{count}</div>
      <div style={{ fontSize: '12px', color: 'var(--c-text-4)', fontWeight: 510, marginTop: '2px' }}>{label}</div>
    </button>
  );
}

function CapacityDemandChart() {
  const { engineers, demandRows, assignments } = useStore();
  const { theme } = useTheme();
  const cc = getChartColors(theme);

  const activeEngineers = engineers.filter(e => e.isActive);
  const totalCap = activeEngineers.reduce((s, e) => s + e.weeklyCapacityHours, 0);
  const totalBau = activeEngineers.reduce((s, e) => s + (e.bauSupportHours ?? 0), 0);

  const weekSet = new Set<string>();
  demandRows.forEach(r => r.weeklyHours.forEach(wh => weekSet.add(wh.weekCommencing)));
  assignments.forEach(a => a.weeklyHours.forEach(wh => weekSet.add(wh.weekCommencing)));
  const weeks = [...weekSet].sort();
  if (weeks.length === 0) return null;

  const data = weeks.map(w => {
    const projectDemand = demandRows.reduce((s, r) =>
      s + (r.weeklyHours.find(h => h.weekCommencing === w)?.hours ?? 0), 0);
    const lockedProjectHours = activeEngineers.reduce((s, e) =>
      s + assignments
        .filter(a => a.engineerId === e.id && a.status === 'locked')
        .reduce((sum, a) => sum + (a.weeklyHours.find(wh => wh.weekCommencing === w)?.hours ?? 0), 0), 0);
    return {
      week: formatWeekLabel(w),
      capacity: totalCap,
      bau: totalBau,
      committed: totalBau + lockedProjectHours,  // stacked: BAU + locked project hours
      projectDemand,
    };
  });

  const tooltipStyle = {
    background: cc.tooltipBg,
    border: `1px solid ${cc.tooltipBorder}`,
    borderRadius: '6px',
    fontSize: '12px',
    color: cc.tooltipText,
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={sectionHead}>Capacity vs Demand Over Time</h2>
      <div style={{
        background: 'var(--c-card)', border: '1px solid var(--c-border)',
        borderRadius: '8px', padding: '16px',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 590, color: 'var(--c-text-1)', marginBottom: '2px' }}>
          Overall Capacity vs Demand
        </div>
        <div style={{ fontSize: '11px', color: 'var(--c-text-4)', marginBottom: '12px' }}>
          Team capacity against project demand and BAU commitments. Committed = BAU + locked project hours.
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={cc.grid} />
            <XAxis dataKey="week" tick={{ fontSize: 9, fill: cc.tick }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fontSize: 10, fill: cc.tick }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: cc.cursor }} />
            <Legend wrapperStyle={{ fontSize: '10px', color: cc.legendText }} />
            <Line type="monotone" dataKey="capacity" name="Capacity (h)" stroke={CHART_LINE_COLORS.capacity} strokeWidth={2} dot={false} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="bau" name="BAU (h)" stroke={CHART_LINE_COLORS.bau} strokeWidth={2} dot={false} strokeDasharray="2 3" />
            <Line type="monotone" dataKey="committed" name="Committed (h)" stroke={CHART_LINE_COLORS.committed} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="projectDemand" name="Project Demand (h)" stroke={CHART_LINE_COLORS.demand} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
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
        <h1 style={{ fontSize: '24px', fontWeight: 590, color: 'var(--c-text-1)', letterSpacing: '-0.03em', margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--c-text-3)', margin: '4px 0 0' }}>
          Digital Manufacturing PMO — Resource Planning
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {STATUS_ORDER.map(s => <StatCard key={s} status={s} count={counts[s]} />)}
      </div>
      <p style={{ fontSize: '11px', color: 'var(--c-text-4)', marginBottom: '32px', marginTop: '-16px' }}>
        Click a counter to see projects in that state
      </p>

      <CapacityDemandChart />
    </div>
  );
}

const sectionHead: React.CSSProperties = {
  fontSize: '13px', fontWeight: 590, color: 'var(--c-text-3)',
  letterSpacing: '0.05em', textTransform: 'uppercase',
  margin: '0 0 12px',
};
