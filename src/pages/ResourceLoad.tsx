import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { formatWeekLabel, groupWeeksByMonth } from '../utils/dates';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Assignment } from '../types';
import { useTheme, getChartColors } from '../store/theme';
import { CHART_LINE_COLORS, getThemeLineColors } from '../utils/chartColors';

type ViewPeriod = 'week' | 'month';

function getPeriods(weeks: string[], viewPeriod: ViewPeriod) {
  if (viewPeriod === 'week') return weeks.map(w => ({ key: w, label: formatWeekLabel(w), weeks: [w] }));
  return groupWeeksByMonth(weeks);
}

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

// ─── Overview ────────────────────────────────────────────────────────────────

function OverallCapacityDemandChart({ viewPeriod }: { viewPeriod: ViewPeriod }) {
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

  const periods = getPeriods(weeks, viewPeriod);

  const data = periods.map(p => {
    const weekCount = p.weeks.length;
    const projectDemand = p.weeks.reduce((s, w) =>
      s + demandRows.reduce((ss, r) =>
        ss + (r.weeklyHours.find(h => h.weekCommencing === w)?.hours ?? 0), 0), 0);
    const lockedProjectHours = p.weeks.reduce((s, w) =>
      s + activeEngineers.reduce((ss, e) =>
        ss + getEngineerWeeklyCommitted(e.id, w, assignments, 'locked'), 0), 0);
    return {
      week: p.label,
      capacity: totalCap * weekCount,
      bau: totalBau * weekCount,
      committed: totalBau * weekCount + lockedProjectHours,
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

  const xInterval = viewPeriod === 'month' ? 0 : 3;

  return (
    <ChartCard
      title="Total Capacity vs Demand"
      subtitle={`${viewPeriod === 'month' ? 'Monthly totals' : 'Weekly hours'}. Committed = BAU + locked project hours (stacked above BAU).`}
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={cc.grid} />
          <XAxis dataKey="week" tick={{ fontSize: 9, fill: cc.tick }} tickLine={false} axisLine={false} interval={xInterval} />
          <YAxis tick={{ fontSize: 10, fill: cc.tick }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: cc.cursor }} />
          <Legend wrapperStyle={{ fontSize: '10px', color: cc.legendText }} />
          <Line type="monotone" dataKey="capacity" name="Capacity (h)" stroke={CHART_LINE_COLORS.capacity} strokeWidth={2} dot={false} strokeDasharray="4 4" />
          <Line type="monotone" dataKey="bau" name="BAU (h)" stroke={CHART_LINE_COLORS.bau} strokeWidth={2} dot={false} strokeDasharray="2 3" />
          <Line type="monotone" dataKey="committed" name="Committed (h)" stroke={CHART_LINE_COLORS.committed} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="projectDemand" name="Project Demand (h)" stroke={CHART_LINE_COLORS.demand} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── By Theme ────────────────────────────────────────────────────────────────

function ThemeCapacityChart({ viewPeriod }: { viewPeriod: ViewPeriod }) {
  const { engineers, demandRows, skills, themes, assignments, projects } = useStore();
  const { theme } = useTheme();
  const cc = getChartColors(theme);

  const weekSet = new Set<string>();
  demandRows.forEach(r => r.weeklyHours.forEach(wh => weekSet.add(wh.weekCommencing)));
  const weeks = [...weekSet].sort();
  if (weeks.length === 0) return null;

  const periods = getPeriods(weeks, viewPeriod);
  const activeThemes = themes.filter(t => t.isActive);

  const data = periods.map(p => {
    const weekCount = p.weeks.length;
    const point: Record<string, string | number> = { week: p.label };
    activeThemes.forEach(t => {
      const themeEngineers = engineers.filter(e => e.isActive && e.themeIds.includes(t.id));
      const themeSkillIds = new Set(skills.filter(s => s.themeId === t.id).map(s => s.id));
      const cap = themeEngineers.reduce((s, e) => s + e.weeklyCapacityHours, 0);
      const themeBAU = themeEngineers.reduce((s, e) => s + (e.bauSupportHours ?? 0), 0);
      const demand = p.weeks.reduce((s, w) =>
        s + demandRows.filter(r => themeSkillIds.has(r.skillId))
          .reduce((ss, r) => ss + (r.weeklyHours.find(h => h.weekCommencing === w)?.hours ?? 0), 0), 0);
      const lockedProjectHours = p.weeks.reduce((s, w) =>
        s + assignments.filter(a => a.status === 'locked').reduce((ss, a) => {
          const dr = demandRows.find(r => r.id === a.demandRowId);
          if (!dr || !themeSkillIds.has(dr.skillId)) return ss;
          return ss + (a.weeklyHours.find(h => h.weekCommencing === w)?.hours ?? 0);
        }, 0), 0);
      point[`${t.id}_cap`] = cap * weekCount;
      point[`${t.id}_demand`] = demand;
      point[`${t.id}_committed`] = themeBAU * weekCount + lockedProjectHours;
    });
    return point;
  });

  const tooltipStyle = {
    background: cc.tooltipBg,
    border: `1px solid ${cc.tooltipBorder}`,
    borderRadius: '6px',
    fontSize: '12px',
    color: cc.tooltipText,
  };

  const xInterval = viewPeriod === 'month' ? 0 : 3;

  return (
    <div>
      {activeThemes.map(t => {
        const colors = getThemeLineColors(t.id);
        const themeSkillIds = new Set(skills.filter(s => s.themeId === t.id).map(s => s.id));
        const themeProjects = projects.filter(p =>
          demandRows.some(r => r.projectId === p.id && themeSkillIds.has(r.skillId))
        );

        return (
          <ChartCard key={t.id} title={`${t.name} — Capacity vs Demand`}
            subtitle={`${viewPeriod === 'month' ? 'Monthly totals' : 'Hours per week'} for this theme's engineers and projects. Committed = BAU + locked hours.`}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={cc.grid} />
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: cc.tick }} tickLine={false} axisLine={false} interval={xInterval} />
                <YAxis tick={{ fontSize: 10, fill: cc.tick }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: cc.cursor }} />
                <Legend wrapperStyle={{ fontSize: '10px', color: cc.legendText }} />
                <Line type="monotone" dataKey={`${t.id}_cap`} name="Capacity (h)" stroke={colors.cap} strokeWidth={2} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey={`${t.id}_demand`} name="Project Demand (h)" stroke={colors.demand} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey={`${t.id}_committed`} name="Committed (h)" stroke={colors.committed} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>

            {themeProjects.length > 0 && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--c-border-sm)' }}>
                <div style={{ fontSize: '11px', fontWeight: 590, color: 'var(--c-text-4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Projects in this theme
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {themeProjects.map(p => {
                    const totalDemand = demandRows
                      .filter(r => r.projectId === p.id && themeSkillIds.has(r.skillId))
                      .reduce((s, r) => s + r.weeklyHours.reduce((ss, wh) => ss + wh.hours, 0), 0);
                    return (
                      <div key={p.id} style={{
                        background: 'var(--c-card-sm)', border: '1px solid var(--c-border-sm)',
                        borderRadius: '5px', padding: '5px 10px', fontSize: '11px',
                      }}>
                        <span style={{ color: 'var(--c-text-2)', fontWeight: 510 }}>{p.name}</span>
                        <span style={{ color: 'var(--c-text-4)', marginLeft: '6px' }}>{totalDemand}h total</span>
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

// ─── By Skill ────────────────────────────────────────────────────────────────

function SkillDemandView({ viewPeriod }: { viewPeriod: ViewPeriod }) {
  const { skills, themes, demandRows, assignments, projects, engineers } = useStore();

  const RELEVANT = new Set(['submitted', 'under_review', 'pending_approval', 'approved']);
  const activeProjectIds = new Set(projects.filter(p => RELEVANT.has(p.status)).map(p => p.id));
  const activeDemandRows = demandRows.filter(r => activeProjectIds.has(r.projectId));

  const weekSet = new Set<string>();
  activeDemandRows.forEach(r => r.weeklyHours.forEach(wh => { if (wh.hours > 0) weekSet.add(wh.weekCommencing); }));
  const weeks = [...weekSet].sort();

  if (weeks.length === 0) {
    return (
      <ChartCard title="Skill Demand vs Committed" subtitle="No submitted demand found.">
        <div style={{ fontSize: '13px', color: 'var(--c-text-4)', padding: '16px 0' }}>
          No projects with submitted or approved demand exist yet.
        </div>
      </ChartCard>
    );
  }

  const periods = getPeriods(weeks, viewPeriod);
  const skillsWithDemand = skills.filter(s => activeDemandRows.some(r => r.skillId === s.id));

  function getDemandForWeeks(skillId: string, periodWeeks: string[]): number {
    return periodWeeks.reduce((s, w) =>
      s + activeDemandRows.filter(r => r.skillId === skillId)
        .reduce((ss, r) => ss + (r.weeklyHours.find(wh => wh.weekCommencing === w)?.hours ?? 0), 0), 0);
  }

  function getCommittedForWeeks(skillId: string, periodWeeks: string[]): number {
    return periodWeeks.reduce((s, w) =>
      s + assignments.filter(a => a.status === 'locked').reduce((ss, a) => {
        const dr = demandRows.find(r => r.id === a.demandRowId && r.skillId === skillId);
        if (!dr) return ss;
        return ss + (a.weeklyHours.find(wh => wh.weekCommencing === w)?.hours ?? 0);
      }, 0), 0);
  }

  function cellBg(demand: number, committed: number): string {
    if (demand === 0) return 'transparent';
    const gap = demand - committed;
    if (gap <= 0) return 'rgba(39,166,68,0.15)';
    if (gap / demand < 0.5) return 'rgba(245,158,11,0.18)';
    return 'rgba(239,68,68,0.18)';
  }

  // Summary always uses all weeks regardless of view (total picture)
  const summary = skillsWithDemand.map(s => {
    const theme = themes.find(t => t.id === s.themeId);
    const totalDemand = getDemandForWeeks(s.id, weeks);
    const totalCommitted = getCommittedForWeeks(s.id, weeks);
    const gap = Math.max(0, totalDemand - totalCommitted);
    const demandWeeks = weeks.filter(w => getDemandForWeeks(s.id, [w]) > 0);
    const peakGapWeek = demandWeeks.length > 0
      ? demandWeeks.reduce((best, w) => {
          const g = getDemandForWeeks(s.id, [w]) - getCommittedForWeeks(s.id, [w]);
          const bg = getDemandForWeeks(s.id, [best]) - getCommittedForWeeks(s.id, [best]);
          return g > bg ? w : best;
        }, demandWeeks[0])
      : null;
    const qualifiedCount = engineers.filter(e => e.isActive && e.skills.some(es => es.skillId === s.id)).length;
    return { skill: s, theme, totalDemand, totalCommitted, gap, peakGapWeek, qualifiedCount };
  }).sort((a, b) => b.gap - a.gap);

  const periodLabel = viewPeriod === 'month' ? 'month' : 'week';

  return (
    <div>
      {/* Heatmap */}
      <ChartCard
        title="Skill Demand vs Committed — Timeline"
        subtitle={`${viewPeriod === 'month' ? 'Monthly totals' : 'Per week'}: demand from all submitted/approved projects vs locked commitments.`}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr>
                <th style={{ ...hmTh, textAlign: 'left', minWidth: '160px', position: 'sticky', left: 0, background: 'var(--c-surface)', zIndex: 2 }}>
                  Skill
                </th>
                {periods.map(p => (
                  <th key={p.key} style={{ ...hmTh, minWidth: viewPeriod === 'month' ? '72px' : '60px' }}>{p.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skillsWithDemand.map(skill => {
                const theme = themes.find(t => t.id === skill.themeId);
                return (
                  <tr key={skill.id}>
                    <td style={{ ...hmTd, position: 'sticky', left: 0, background: 'var(--c-surface)', zIndex: 1 }}>
                      <div style={{ fontWeight: 510, color: 'var(--c-text-2)', fontSize: '12px' }}>{skill.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--c-text-4)' }}>{theme?.name}</div>
                    </td>
                    {periods.map(p => {
                      const demand = getDemandForWeeks(skill.id, p.weeks);
                      const committed = getCommittedForWeeks(skill.id, p.weeks);
                      const gap = demand - committed;
                      return (
                        <td
                          key={p.key}
                          style={{ ...hmTd, background: cellBg(demand, committed), textAlign: 'center', padding: '5px 4px' }}
                          title={demand > 0 ? `${skill.name} ${p.label}: ${demand}h demand, ${committed}h committed${gap > 0 ? `, ${gap}h gap` : ', covered'}` : undefined}
                        >
                          {demand > 0 ? (
                            <div style={{ lineHeight: 1.4 }}>
                              <div style={{ color: 'var(--c-text-2)', fontWeight: gap > 0 ? 590 : 400, fontSize: '11px' }}>{demand}h</div>
                              {committed > 0 && <div style={{ color: '#4ade80', fontSize: '9px' }}>✓{committed}h</div>}
                              {gap > 0 && <div style={{ color: '#f87171', fontSize: '9px', fontWeight: 590 }}>−{gap}h</div>}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--c-border-lg)', fontSize: '10px' }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: '14px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--c-border-sm)', flexWrap: 'wrap' }}>
          {[
            { color: 'rgba(39,166,68,0.15)', label: 'Covered — committed meets demand' },
            { color: 'rgba(245,158,11,0.18)', label: `Partial gap — < 50% unfilled` },
            { color: 'rgba(239,68,68,0.18)', label: 'Significant gap — ≥ 50% unfilled' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color, border: '1px solid var(--c-border)' }} />
              <span style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>{label}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Risk summary — always totals, independent of view period */}
      <ChartCard
        title="Skill Risk Summary"
        subtitle={`Total exposure across all ${periodLabel}s. Skills ranked by unfilled gap. Demand includes submitted, under review, pending and approved projects.`}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
            <thead>
              <tr>
                {[
                  { label: 'Skill', align: 'left' },
                  { label: 'Theme', align: 'left' },
                  { label: 'Total Demand', align: 'center' },
                  { label: 'Committed', align: 'center' },
                  { label: 'Gap', align: 'center' },
                  { label: 'Peak Gap Week', align: 'center' },
                  { label: 'Qualified Engineers', align: 'center' },
                ].map(({ label, align }) => (
                  <th key={label} style={{ ...hmTh, textAlign: align as React.CSSProperties['textAlign'] }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.map(({ skill, theme, totalDemand, totalCommitted, gap, peakGapWeek, qualifiedCount }) => {
                const gapRatio = totalDemand > 0 ? gap / totalDemand : 0;
                const gapColor = gap === 0 ? '#4ade80' : gapRatio < 0.5 ? '#f59e0b' : '#f87171';
                return (
                  <tr key={skill.id}>
                    <td style={{ ...hmTd, fontWeight: 510, color: 'var(--c-text-2)' }}>{skill.name}</td>
                    <td style={{ ...hmTd, color: 'var(--c-text-4)' }}>{theme?.name ?? '—'}</td>
                    <td style={{ ...hmTd, textAlign: 'center', color: 'var(--c-text-2)' }}>{totalDemand}h</td>
                    <td style={{ ...hmTd, textAlign: 'center', color: 'var(--c-text-3)' }}>{totalCommitted}h</td>
                    <td style={{ ...hmTd, textAlign: 'center', fontWeight: gap > 0 ? 590 : 400, color: gapColor }}>
                      {gap === 0 ? '✓ Covered' : `−${gap}h`}
                    </td>
                    <td style={{ ...hmTd, textAlign: 'center', color: 'var(--c-text-4)' }}>
                      {peakGapWeek && gap > 0 ? formatWeekLabel(peakGapWeek) : '—'}
                    </td>
                    <td style={{ ...hmTd, textAlign: 'center', color: qualifiedCount === 0 ? '#f87171' : 'var(--c-text-3)' }}>
                      {qualifiedCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

// ─── By Engineer ─────────────────────────────────────────────────────────────

function EngineerUtilizationHeatmap({ viewPeriod }: { viewPeriod: ViewPeriod }) {
  const { engineers, assignments } = useStore();

  const weekSet = new Set<string>();
  assignments.forEach(a => a.weeklyHours.forEach(wh => weekSet.add(wh.weekCommencing)));
  const weeks = [...weekSet].sort().slice(0, 24);
  if (weeks.length === 0) return null;

  const periods = getPeriods(weeks, viewPeriod);

  function getUtilPct(engineerId: string, periodWeeks: string[], totalCap: number, bauHours: number): number {
    if (totalCap === 0) return 0;
    const weekCount = periodWeeks.length;
    const projectCommitted = periodWeeks.reduce((s, w) =>
      s + getEngineerWeeklyCommitted(engineerId, w, assignments, 'all'), 0);
    return Math.min(120, Math.round((projectCommitted + bauHours * weekCount) / (totalCap * weekCount) * 100));
  }

  function utilColor(pct: number): string {
    if (pct === 0) return 'var(--c-card)';
    if (pct < 50) return `rgba(94,106,210,${0.15 + pct / 100 * 0.4})`;
    if (pct < 85) return `rgba(245,158,11,${0.4 + (pct - 50) / 50 * 0.4})`;
    return '#ef4444';
  }

  return (
    <ChartCard
      title="Engineer Utilization Heat Map"
      subtitle={`% of total ${viewPeriod === 'month' ? 'monthly' : 'weekly'} capacity (project hours + BAU). Over 85% = near or over capacity.`}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr>
              <th style={{ ...hmTh, textAlign: 'left', minWidth: '130px', position: 'sticky', left: 0, background: 'var(--c-surface)', zIndex: 2 }}>Engineer</th>
              {periods.map(p => <th key={p.key} style={{ ...hmTh, minWidth: viewPeriod === 'month' ? '56px' : '48px' }}>{p.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {engineers.filter(e => e.isActive).map(eng => {
              const bau = eng.bauSupportHours ?? 0;
              const totalCap = eng.weeklyCapacityHours;
              return (
                <tr key={eng.id}>
                  <td style={{ ...hmTd, position: 'sticky', left: 0, background: 'var(--c-surface)', zIndex: 1, fontWeight: 510, color: 'var(--c-text-2)' }}>
                    <div>{eng.name.split(' ')[0]}</div>
                    <div style={{ fontSize: '10px', color: 'var(--c-text-4)' }}>
                      {totalCap}h/wk · <span style={{ color: '#f59e0b88' }}>{bau}h BAU</span>
                    </div>
                  </td>
                  {periods.map(p => {
                    const weekCount = p.weeks.length;
                    const pct = getUtilPct(eng.id, p.weeks, totalCap, bau);
                    const projectCommitted = p.weeks.reduce((s, w) =>
                      s + getEngineerWeeklyCommitted(eng.id, w, assignments, 'all'), 0);
                    const totalCommitted = projectCommitted + bau * weekCount;
                    const totalCapForPeriod = totalCap * weekCount;
                    return (
                      <td key={p.key} style={{ ...hmTd, background: utilColor(pct), textAlign: 'center' }}
                        title={`${eng.name} ${p.label}: ${projectCommitted}h project + ${bau * weekCount}h BAU = ${totalCommitted}h / ${totalCapForPeriod}h (${pct}%)`}>
                        {pct > 0 ? <span style={{ fontSize: '10px', color: pct > 70 ? '#fff' : 'var(--c-text-2)', fontWeight: pct >= 100 ? 590 : 400 }}>{pct}%</span> : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--c-border-sm)', flexWrap: 'wrap' }}>
        {[
          { color: 'rgba(94,106,210,0.4)', label: '< 50% — Available capacity' },
          { color: 'rgba(245,158,11,0.7)', label: '50–85% — Busy' },
          { color: '#ef4444', label: '≥ 85% — Near / Over capacity' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} />
            <span style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>{label}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

function EngineerProjectBreakdown({ viewPeriod }: { viewPeriod: ViewPeriod }) {
  const { engineers, assignments, projects } = useStore();

  const weekSet = new Set<string>();
  assignments.forEach(a => a.weeklyHours.forEach(wh => weekSet.add(wh.weekCommencing)));
  const weeks = [...weekSet].sort().slice(0, 16);
  if (weeks.length === 0) return null;

  const periods = getPeriods(weeks, viewPeriod);
  const activeEngineers = engineers.filter(e => e.isActive);

  return (
    <ChartCard
      title="Project Breakdown by Engineer"
      subtitle={`Hours assigned per project per ${viewPeriod === 'month' ? 'month' : 'week'}. BAU support shown separately.`}
    >
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
          <div key={eng.id} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--c-border-sm)' }}>
            <div style={{ fontSize: '12px', fontWeight: 590, color: 'var(--c-text-2)', marginBottom: '6px' }}>
              {eng.name}
              <span style={{ fontSize: '11px', color: 'var(--c-text-4)', marginLeft: '6px' }}>
                {eng.weeklyCapacityHours}h/wk total · {eng.weeklyCapacityHours - bau}h project · <span style={{ color: '#f59e0b' }}>{bau}h BAU</span>
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ ...hmTh, textAlign: 'left', minWidth: '170px', color: 'var(--c-text-4)' }}>Project</th>
                    {periods.map(p => <th key={p.key} style={{ ...hmTh, minWidth: viewPeriod === 'month' ? '56px' : '44px' }}>{p.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {projectEntries.map(([projId, { name, weeklyHours }]) => (
                    <tr key={projId}>
                      <td style={{ ...hmTd, color: 'var(--c-text-3)', fontWeight: 510, paddingRight: '12px' }}>{name}</td>
                      {periods.map(p => {
                        const h = p.weeks.reduce((s, w) => s + (weeklyHours[w] ?? 0), 0);
                        return (
                          <td key={p.key} style={{ ...hmTd, textAlign: 'center', color: h > 0 ? '#7170ff' : 'var(--c-border)' }}>
                            {h > 0 ? `${h}h` : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {bau > 0 && (
                    <tr>
                      <td style={{ ...hmTd, color: '#f59e0b', fontWeight: 590, paddingRight: '12px' }}>BAU Support</td>
                      {periods.map(p => (
                        <td key={p.key} style={{ ...hmTd, textAlign: 'center', color: '#f59e0b88' }}>
                          {bau * p.weeks.length}h
                        </td>
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
      background: 'var(--c-card)', border: '1px solid var(--c-border)',
      borderRadius: '8px', padding: '16px', marginBottom: '24px',
    }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 590, color: 'var(--c-text-1)' }}>{title}</div>
        <div style={{ fontSize: '11px', color: 'var(--c-text-4)', marginTop: '2px' }}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ResourceLoad() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'theme' | 'skill' | 'engineers'>('overview');
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('week');

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => navigate('/')} style={backBtn}>← Dashboard</button>
        <h1 style={h1}>Resource Load</h1>
        <p style={sub}>Visualise engineering capacity, demand, and utilisation across themes and time.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', borderBottom: '1px solid var(--c-border)' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {([
            { key: 'overview', label: 'Overview' },
            { key: 'theme', label: 'By Theme' },
            { key: 'skill', label: 'By Skill' },
            { key: 'engineers', label: 'By Engineer' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === t.key ? '#7170ff' : 'transparent'}`,
              color: activeTab === t.key ? 'var(--c-text-1)' : 'var(--c-text-3)',
              fontSize: '13px', fontWeight: 510,
              padding: '8px 16px', cursor: 'pointer', marginBottom: '-1px',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Period toggle */}
        <div style={{ display: 'flex', gap: '4px', paddingBottom: '10px' }}>
          {(['week', 'month'] as ViewPeriod[]).map(vp => (
            <button key={vp} onClick={() => setViewPeriod(vp)} style={{
              background: viewPeriod === vp ? 'rgba(94,106,210,0.2)' : 'var(--c-card-hover)',
              border: `1px solid ${viewPeriod === vp ? 'rgba(94,106,210,0.5)' : 'var(--c-border)'}`,
              borderRadius: '5px',
              color: viewPeriod === vp ? '#7170ff' : 'var(--c-text-3)',
              fontSize: '12px', fontWeight: 510,
              padding: '4px 12px', cursor: 'pointer',
            }}>
              {vp === 'week' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && <OverallCapacityDemandChart viewPeriod={viewPeriod} />}
      {activeTab === 'theme' && <ThemeCapacityChart viewPeriod={viewPeriod} />}
      {activeTab === 'skill' && <SkillDemandView viewPeriod={viewPeriod} />}
      {activeTab === 'engineers' && (
        <>
          <EngineerUtilizationHeatmap viewPeriod={viewPeriod} />
          <EngineerProjectBreakdown viewPeriod={viewPeriod} />
        </>
      )}
    </div>
  );
}

const h1: React.CSSProperties = { fontSize: '24px', fontWeight: 590, color: 'var(--c-text-1)', letterSpacing: '-0.03em', margin: '4px 0' };
const sub: React.CSSProperties = { fontSize: '13px', color: 'var(--c-text-3)', margin: 0 };
const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--c-text-4)', fontSize: '13px', cursor: 'pointer', padding: '0 0 8px', display: 'block' };
const hmTh: React.CSSProperties = { fontSize: '10px', color: 'var(--c-text-4)', fontWeight: 510, padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid var(--c-border-sm)', whiteSpace: 'nowrap' };
const hmTd: React.CSSProperties = { padding: '4px 6px', borderBottom: '1px solid var(--c-border-xs)', fontSize: '11px' };
