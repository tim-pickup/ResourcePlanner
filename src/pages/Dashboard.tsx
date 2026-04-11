import { useStore } from '../store';
import { ProjectStatus } from '../types';
import { formatWeekLabel } from '../utils/dates';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

function CapacityDemandChart() {
  const { engineers, demandRows } = useStore();

  const totalCapacity = engineers.reduce((s, e) => s + (e.isActive ? e.weeklyCapacityHours : 0), 0);

  const weekSet = new Set<string>();
  demandRows.forEach(r => r.weeklyHours.forEach(wh => weekSet.add(wh.weekCommencing)));
  const weeks = [...weekSet].sort();

  if (weeks.length === 0) return null;

  const data = weeks.map(w => {
    const demand = demandRows.reduce((s, r) => {
      const wh = r.weeklyHours.find(h => h.weekCommencing === w);
      return s + (wh?.hours ?? 0);
    }, 0);
    return { week: formatWeekLabel(w), capacity: totalCapacity, demand };
  });

  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={sectionHead}>Capacity vs Demand Over Time</h2>
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px', padding: '16px',
      }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#62666d' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#62666d' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={CUSTOM_TOOLTIP_STYLE}
              labelStyle={{ color: '#8a8f98', marginBottom: '4px' }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#8a8f98', paddingTop: '8px' }} />
            <Bar dataKey="capacity" name="Team Capacity (h)" fill="#5e6ad255" radius={[2,2,0,0]} />
            <Bar dataKey="demand" name="Total Demand (h)" fill="#f59e0b" radius={[2,2,0,0]} />
          </BarChart>
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
