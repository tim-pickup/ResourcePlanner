import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { formatWeekLabel } from '../utils/dates';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ─── Utility ────────────────────────────────────────────────────────────────

import { Assignment } from '../types';

function getEngineerWeeklyCommitted(
  engineerId: string,
  week: string,
  assignments: Assignment[],
  statusFilter: 'all' | 'locked'
): number {
  return assignments
    .filter(a => a.engineerId === engineerId && (statusFilter === 'all' || a.status === statusFilter))
    .reduce((sum, a) => {
      const wh = a.weeklyHours.find(w => w.weekCommencing === week);
      return sum + (wh?.hours ?? 0);
    }, 0);
}

const TOOLTIP_STYLE = {
  background: '#191a1b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  fontSize: '12px',
  color: '#d0d6e0',
};

const THEME_COLORS: Record<string, { cap: string; demand: string }> = {
  'theme-mom': { cap: '#5e6ad2', demand: '#a78bfa' },
  'theme-miv': { cap: '#27a644', demand: '#4ade80' },
};

// ─── Sub-charts ─────────────────────────────────────────────────────────────

function OverallCapacityDemandChart() {
  const { engineers, demandRows, assignments } = useStore();

  const totalCap = engineers.reduce((s, e) => s + (e.isActive ? e.weeklyCapacityHours : 0), 0);

  const weekSet = new Set<string>();
  demandRows.forEach(r => r.weeklyHours.forEach(wh => weekSet.add(wh.weekCommencing)));
  const weeks = [...weekSet].sort();
  if (weeks.length === 0) return null;

  const data = weeks.map(w => {
    const demand = demandRows.reduce((s, r) => {
      return s + (r.weeklyHours.find(h => h.weekCommencing === w)?.hours ?? 0);
    }, 0);
    const committed = engineers.reduce((s, e) => {
      return s + getEngineerWeeklyCommitted(e.id, w, assignments, 'locked');
    }, 0);
    return { week: formatWeekLabel(w), capacity: totalCap, demand, committed };
  });

  return (
    <ChartCard title="Total Capacity vs Demand" subtitle="Team capacity (all engineers) against cumulative demand across all projects">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#62666d' }} tickLine={false} axisLine={false} interval={3} />
          <YAxis tick={{ fontSize: 10, fill: '#62666d' }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#8a8f98' }} />
          <Bar dataKey="capacity" name="Capacity (h)" fill="rgba(94,106,210,0.3)" radius={[2,2,0,0]} />
          <Bar dataKey="demand" name="Total Demand (h)" fill="#f59e0b88" radius={[2,2,0,0]} />
          <Bar dataKey="committed" name="Locked Assignments (h)" fill="#5e6ad2" radius={[2,2,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ThemeCapacityChart() {
  const { engineers, demandRows, skills, themes, assignments } = useStore();

  const weekSet = new Set<string>();
  demandRows.forEach(r => r.weeklyHours.forEach(wh => weekSet.add(wh.weekCommencing)));
  const weeks = [...weekSet].sort();
  if (weeks.length === 0) return null;

  const activeThemes = themes.filter(t => t.isActive);

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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      {activeThemes.map(theme => {
        const colors = THEME_COLORS[theme.id] ?? { cap: '#5e6ad2', demand: '#f59e0b' };
        return (
          <ChartCard key={theme.id} title={`${theme.name} — Capacity vs Demand`} subtitle="Hours per week for this theme's engineers and projects">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#62666d' }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: '#62666d' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: '10px', color: '#8a8f98' }} />
                <Line type="monotone" dataKey={`${theme.id}_cap`} name="Capacity (h)" stroke={colors.cap} strokeWidth={2} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey={`${theme.id}_demand`} name="Demand (h)" stroke={colors.demand} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey={`${theme.id}_committed`} name="Committed (h)" stroke="#27a644" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      })}
    </div>
  );
}

function EngineerUtilizationHeatmap() {
  const { engineers, assignments } = useStore();

  const weekSet = new Set<string>();
  assignments.forEach(a => a.weeklyHours.forEach(wh => weekSet.add(wh.weekCommencing)));
  const weeks = [...weekSet].sort().slice(0, 24); // cap at 24 weeks for readability

  if (weeks.length === 0) return null;

  function getUtilPct(engineerId: string, week: string, capacity: number): number {
    if (capacity === 0) return 0;
    const committed = getEngineerWeeklyCommitted(engineerId, week, assignments, 'all');
    return Math.min(100, Math.round(committed / capacity * 100));
  }

  function utilColor(pct: number): string {
    if (pct === 0) return 'rgba(255,255,255,0.04)';
    if (pct < 50) return `rgba(94,106,210,${0.15 + pct / 100 * 0.4})`;
    if (pct < 80) return `rgba(245,158,11,${0.4 + (pct - 50) / 50 * 0.4})`;
    if (pct < 100) return `rgba(239,68,68,0.6)`;
    return '#ef4444';
  }

  return (
    <ChartCard title="Engineer Utilization Heat Map" subtitle="% of weekly capacity committed (locked + tentative). Red = over 80%, amber = 50–80%, blue = under 50%.">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr>
              <th style={{ ...hmTh, textAlign: 'left', minWidth: '110px', position: 'sticky', left: 0, background: '#0f1011', zIndex: 2 }}>Engineer</th>
              {weeks.map(w => (
                <th key={w} style={{ ...hmTh, minWidth: '48px' }}>{formatWeekLabel(w)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {engineers.filter(e => e.isActive).map(eng => (
              <tr key={eng.id}>
                <td style={{ ...hmTd, position: 'sticky', left: 0, background: '#0f1011', zIndex: 1, fontWeight: 510, color: '#d0d6e0' }}>
                  <div>{eng.name.split(' ')[0]}</div>
                  <div style={{ fontSize: '10px', color: '#62666d' }}>{eng.weeklyCapacityHours}h/wk</div>
                </td>
                {weeks.map(w => {
                  const pct = getUtilPct(eng.id, w, eng.weeklyCapacityHours);
                  const committed = getEngineerWeeklyCommitted(eng.id, w, assignments, 'all');
                  return (
                    <td key={w} style={{ ...hmTd, background: utilColor(pct), textAlign: 'center' }}
                      title={`${eng.name}: ${committed}h/${eng.weeklyCapacityHours}h (${pct}%)`}>
                      {pct > 0 ? <span style={{ fontSize: '10px', color: pct > 60 ? '#fff' : '#d0d6e0', fontWeight: pct >= 100 ? 590 : 400 }}>{pct}%</span> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
        {[
          { color: 'rgba(94,106,210,0.4)', label: '< 50% — Available capacity' },
          { color: 'rgba(245,158,11,0.7)', label: '50–80% — Busy' },
          { color: '#ef4444', label: '≥ 80% — Near / Over capacity' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} />
            <span style={{ fontSize: '11px', color: '#62666d' }}>{label}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

function EngineerBarChart() {
  const { engineers, assignments } = useStore();

  // Show per-engineer total committed hours (locked) and available capacity
  const data = engineers.filter(e => e.isActive).map(eng => {
    const lockedHours = assignments
      .filter(a => a.engineerId === eng.id && a.status === 'locked')
      .reduce((s, a) => s + a.weeklyHours.reduce((ss, wh) => ss + wh.hours, 0), 0);
    const tentativeHours = assignments
      .filter(a => a.engineerId === eng.id && a.status === 'tentative')
      .reduce((s, a) => s + a.weeklyHours.reduce((ss, wh) => ss + wh.hours, 0), 0);
    const totalCapHours = assignments.length > 0
      ? (() => {
          const weekSet = new Set<string>();
          assignments.forEach(a => a.weeklyHours.forEach(wh => weekSet.add(wh.weekCommencing)));
          return weekSet.size * eng.weeklyCapacityHours;
        })()
      : eng.weeklyCapacityHours * 8;
    return {
      name: eng.name.split(' ')[0],
      locked: lockedHours,
      tentative: tentativeHours,
      available: Math.max(0, totalCapHours - lockedHours - tentativeHours),
    };
  });

  return (
    <ChartCard title="Engineer Commitment Summary" subtitle="Total hours across all weeks: locked assignments, tentative, and remaining available capacity">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8a8f98' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#62666d' }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#8a8f98' }} />
          <Bar dataKey="locked" name="Locked (h)" stackId="a" fill="#5e6ad2" radius={[0,0,0,0]} />
          <Bar dataKey="tentative" name="Tentative (h)" stackId="a" fill="#f59e0b88" radius={[0,0,0,0]} />
          <Bar dataKey="available" name="Available (h)" stackId="a" fill="rgba(255,255,255,0.06)" radius={[2,2,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Layout wrapper ──────────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px', padding: '16px', marginBottom: '24px',
    }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 590, color: '#f7f8f8' }}>{title}</div>
        <div style={{ fontSize: '11px', color: '#62666d', marginTop: '2px' }}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ResourceLoad() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'theme' | 'engineers'>('overview');

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => navigate('/')} style={backBtn}>← Dashboard</button>
        <h1 style={h1}>Resource Load</h1>
        <p style={sub}>Visualise engineering capacity, demand, and utilisation across themes and time.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'theme', label: 'By Theme' },
          { key: 'engineers', label: 'Engineers' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            background: 'none', border: 'none',
            borderBottom: `2px solid ${activeTab === t.key ? '#7170ff' : 'transparent'}`,
            color: activeTab === t.key ? '#f7f8f8' : '#8a8f98',
            fontSize: '13px', fontWeight: 510,
            padding: '8px 16px', cursor: 'pointer', marginBottom: '-1px',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <OverallCapacityDemandChart />
          <EngineerBarChart />
        </>
      )}
      {activeTab === 'theme' && <ThemeCapacityChart />}
      {activeTab === 'engineers' && <EngineerUtilizationHeatmap />}
    </div>
  );
}

const h1: React.CSSProperties = { fontSize: '24px', fontWeight: 590, color: '#f7f8f8', letterSpacing: '-0.03em', margin: '4px 0' };
const sub: React.CSSProperties = { fontSize: '13px', color: '#8a8f98', margin: 0 };
const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#62666d', fontSize: '13px', cursor: 'pointer', padding: '0 0 8px', display: 'block' };
const hmTh: React.CSSProperties = { fontSize: '10px', color: '#62666d', fontWeight: 510, padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' };
const hmTd: React.CSSProperties = { padding: '4px 6px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '11px' };
