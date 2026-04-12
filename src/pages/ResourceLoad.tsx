import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { formatWeekLabel } from '../utils/dates';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

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

// ─── Overview ────────────────────────────────────────────────────────────────

function OverallCapacityDemandChart() {
  const { engineers, demandRows, assignments } = useStore();
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
    const committed = activeEngineers.reduce((s, e) =>
      s + getEngineerWeeklyCommitted(e.id, w, assignments, 'locked'), 0);
    return {
      week: formatWeekLabel(w),
      capacity: totalCap,
      bauDemand: totalBau,
      projectDemand,
      committed,
    };
  });

  return (
    <ChartCard title="Total Capacity vs Demand" subtitle="Team capacity against project demand and BAU support commitments">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#62666d' }} tickLine={false} axisLine={false} interval={3} />
          <YAxis tick={{ fontSize: 10, fill: '#62666d' }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
          <Legend wrapperStyle={{ fontSize: '10px', color: '#8a8f98' }} />
          <Line type="monotone" dataKey="capacity" name="Capacity (h)" stroke="#5e6ad2" strokeWidth={2} dot={false} strokeDasharray="4 4" />
          <Line type="monotone" dataKey="bauDemand" name="BAU Support (h)" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="2 3" />
          <Line type="monotone" dataKey="projectDemand" name="Project Demand (h)" stroke="#a78bfa" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="committed" name="Committed (h)" stroke="#27a644" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── By Theme ────────────────────────────────────────────────────────────────

function ThemeCapacityChart() {
  const { engineers, demandRows, skills, themes, assignments, projects } = useStore();

  const weekSet = new Set<string>();
  demandRows.forEach(r => r.weeklyHours.forEach(wh => weekSet.add(wh.weekCommencing)));
  const weeks = [...weekSet].sort();
  if (weeks.length === 0) return null;

  const activeThemes = themes.filter(t => t.isActive);
  const THEME_COLORS: Record<string, { cap: string; demand: string }> = {
    'theme-mom': { cap: '#5e6ad2', demand: '#a78bfa' },
    'theme-miv': { cap: '#27a644', demand: '#4ade80' },
  };

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
    <div>
      {activeThemes.map(theme => {
        const colors = THEME_COLORS[theme.id] ?? { cap: '#5e6ad2', demand: '#f59e0b' };
        const themeSkillIds = new Set(skills.filter(s => s.themeId === theme.id).map(s => s.id));
        const themeProjects = projects.filter(p =>
          demandRows.some(r => r.projectId === p.id && themeSkillIds.has(r.skillId))
        );

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

            {/* Project breakdown for this theme */}
            {themeProjects.length > 0 && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', fontWeight: 590, color: '#62666d', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Projects in this theme
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {themeProjects.map(p => {
                    const totalDemand = demandRows
                      .filter(r => r.projectId === p.id && themeSkillIds.has(r.skillId))
                      .reduce((s, r) => s + r.weeklyHours.reduce((ss, wh) => ss + wh.hours, 0), 0);
                    return (
                      <div key={p.id} style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '5px', padding: '5px 10px', fontSize: '11px',
                      }}>
                        <span style={{ color: '#d0d6e0', fontWeight: 510 }}>{p.name}</span>
                        <span style={{ color: '#62666d', marginLeft: '6px' }}>{totalDemand}h total</span>
                        <span style={{
                          marginLeft: '6px', fontSize: '10px', padding: '1px 5px', borderRadius: '4px',
                          background: p.status === 'approved' ? 'rgba(39,166,68,0.12)' : 'rgba(245,158,11,0.1)',
                          color: p.status === 'approved' ? '#4ade80' : '#f59e0b',
                        }}>{p.status.replace('_', ' ')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </ChartCard>
        );
      })}
    </div>
  );
}

// ─── By Engineer ─────────────────────────────────────────────────────────────

function EngineerUtilizationHeatmap() {
  const { engineers, assignments } = useStore();

  const weekSet = new Set<string>();
  assignments.forEach(a => a.weeklyHours.forEach(wh => weekSet.add(wh.weekCommencing)));
  const weeks = [...weekSet].sort().slice(0, 24);
  if (weeks.length === 0) return null;

  function netCapacity(eng: (typeof engineers)[0]) {
    return eng.weeklyCapacityHours - (eng.bauSupportHours ?? 0);
  }

  function getUtilPct(engineerId: string, week: string, cap: number): number {
    if (cap === 0) return 0;
    const committed = getEngineerWeeklyCommitted(engineerId, week, assignments, 'all');
    return Math.min(100, Math.round(committed / cap * 100));
  }

  function utilColor(pct: number): string {
    if (pct === 0) return 'rgba(255,255,255,0.04)';
    if (pct < 50) return `rgba(94,106,210,${0.15 + pct / 100 * 0.4})`;
    if (pct < 80) return `rgba(245,158,11,${0.4 + (pct - 50) / 50 * 0.4})`;
    return '#ef4444';
  }

  return (
    <ChartCard title="Engineer Utilization Heat Map" subtitle="% of weekly project capacity committed (locked + tentative). BAU hours excluded from capacity denominator.">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr>
              <th style={{ ...hmTh, textAlign: 'left', minWidth: '130px', position: 'sticky', left: 0, background: '#0f1011', zIndex: 2 }}>Engineer</th>
              {weeks.map(w => <th key={w} style={{ ...hmTh, minWidth: '48px' }}>{formatWeekLabel(w)}</th>)}
            </tr>
          </thead>
          <tbody>
            {engineers.filter(e => e.isActive).map(eng => {
              const cap = netCapacity(eng);
              return (
                <tr key={eng.id}>
                  <td style={{ ...hmTd, position: 'sticky', left: 0, background: '#0f1011', zIndex: 1, fontWeight: 510, color: '#d0d6e0' }}>
                    <div>{eng.name.split(' ')[0]}</div>
                    <div style={{ fontSize: '10px', color: '#62666d' }}>
                      {cap}h proj · <span style={{ color: '#f59e0b88' }}>{eng.bauSupportHours ?? 0}h BAU</span>
                    </div>
                  </td>
                  {weeks.map(w => {
                    const pct = getUtilPct(eng.id, w, cap);
                    const committed = getEngineerWeeklyCommitted(eng.id, w, assignments, 'all');
                    return (
                      <td key={w} style={{ ...hmTd, background: utilColor(pct), textAlign: 'center' }}
                        title={`${eng.name}: ${committed}h/${cap}h project (${pct}%) + ${eng.bauSupportHours ?? 0}h BAU`}>
                        {pct > 0 ? <span style={{ fontSize: '10px', color: pct > 60 ? '#fff' : '#d0d6e0', fontWeight: pct >= 100 ? 590 : 400 }}>{pct}%</span> : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
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

function EngineerProjectBreakdown() {
  const { engineers, assignments, projects } = useStore();

  const weekSet = new Set<string>();
  assignments.forEach(a => a.weeklyHours.forEach(wh => weekSet.add(wh.weekCommencing)));
  const weeks = [...weekSet].sort().slice(0, 16);
  if (weeks.length === 0) return null;

  const activeEngineers = engineers.filter(e => e.isActive);

  return (
    <ChartCard title="Project Breakdown by Engineer" subtitle="Hours assigned per project per week. BAU support shown separately.">
      {activeEngineers.map(eng => {
        const engAssignments = assignments.filter(a => a.engineerId === eng.id);
        const projectMap = new Map<string, { name: string; weeklyHours: Record<string, number> }>();
        engAssignments.forEach(a => {
          const proj = projects.find(p => p.id === a.projectId);
          if (!proj) return;
          if (!projectMap.has(a.projectId)) projectMap.set(a.projectId, { name: proj.name, weeklyHours: {} });
          a.weeklyHours.forEach(wh => {
            const entry = projectMap.get(a.projectId)!;
            entry.weeklyHours[wh.weekCommencing] = (entry.weeklyHours[wh.weekCommencing] ?? 0) + wh.hours;
          });
        });

        const projectEntries = [...projectMap.entries()];
        const bau = eng.bauSupportHours ?? 0;
        if (projectEntries.length === 0 && bau === 0) return null;

        return (
          <div key={eng.id} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '12px', fontWeight: 590, color: '#d0d6e0', marginBottom: '6px' }}>
              {eng.name}
              <span style={{ fontSize: '11px', color: '#62666d', marginLeft: '6px' }}>
                {eng.weeklyCapacityHours}h/wk total · {eng.weeklyCapacityHours - bau}h project · <span style={{ color: '#f59e0b' }}>{bau}h BAU</span>
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ ...hmTh, textAlign: 'left', minWidth: '170px', color: '#62666d' }}>Project</th>
                    {weeks.map(w => <th key={w} style={{ ...hmTh, minWidth: '44px' }}>{formatWeekLabel(w)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {projectEntries.map(([projId, { name, weeklyHours }]) => (
                    <tr key={projId}>
                      <td style={{ ...hmTd, color: '#8a8f98', fontWeight: 510, paddingRight: '12px' }}>{name}</td>
                      {weeks.map(w => {
                        const h = weeklyHours[w] ?? 0;
                        return (
                          <td key={w} style={{ ...hmTd, textAlign: 'center', color: h > 0 ? '#7170ff' : 'rgba(255,255,255,0.1)' }}>
                            {h > 0 ? `${h}h` : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {bau > 0 && (
                    <tr>
                      <td style={{ ...hmTd, color: '#f59e0b', fontWeight: 590, paddingRight: '12px' }}>BAU Support</td>
                      {weeks.map(w => (
                        <td key={w} style={{ ...hmTd, textAlign: 'center', color: '#f59e0b88' }}>{bau}h</td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
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

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'theme', label: 'By Theme' },
          { key: 'engineers', label: 'By Engineer' },
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

      {activeTab === 'overview' && <OverallCapacityDemandChart />}
      {activeTab === 'theme' && <ThemeCapacityChart />}
      {activeTab === 'engineers' && (
        <>
          <EngineerUtilizationHeatmap />
          <EngineerProjectBreakdown />
        </>
      )}
    </div>
  );
}

const h1: React.CSSProperties = { fontSize: '24px', fontWeight: 590, color: '#f7f8f8', letterSpacing: '-0.03em', margin: '4px 0' };
const sub: React.CSSProperties = { fontSize: '13px', color: '#8a8f98', margin: 0 };
const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#62666d', fontSize: '13px', cursor: 'pointer', padding: '0 0 8px', display: 'block' };
const hmTh: React.CSSProperties = { fontSize: '10px', color: '#62666d', fontWeight: 510, padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' };
const hmTd: React.CSSProperties = { padding: '4px 6px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '11px' };
