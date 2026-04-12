import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import WeeklyGrid, { GridRow } from '../components/WeeklyGrid';
import CapacityPanel from '../components/CapacityPanel';
import { getProjectWeeks, formatDateRange, genId } from '../utils/dates';
import { getQualifiedEngineers, getEngineerAvailableHours } from '../utils/capacity';

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customHoursMap, setCustomHoursMap] = useState<Record<string, number>>({});
  const store = useStore();
  const {
    projects, demandRows, assignments, engineers, skills, themes, skillLevels,
    updateProject, addAssignment, removeAssignment,
  } = store;

  const project = projects.find(p => p.id === id);
  if (!project) return <div style={{ color: '#ef4444', padding: '32px' }}>Project not found.</div>;

  const rows = demandRows.filter(r => r.projectId === id);
  const weeks = getProjectWeeks(project.startDate, project.endDate);
  const projectAssignments = assignments.filter(a => a.projectId === id);

  // Check full coverage: every week of every demand row must have assigned hours >= demand hours
  const allCovered = rows.length > 0 && rows.every(dr =>
    dr.weeklyHours.every(wh => {
      if (wh.hours === 0) return true;
      const assigned = projectAssignments
        .filter(a => a.demandRowId === dr.id)
        .reduce((sum, a) => {
          const awh = a.weeklyHours.find(w => w.weekCommencing === wh.weekCommencing);
          return sum + (awh?.hours ?? 0);
        }, 0);
      return assigned >= wh.hours;
    })
  );

  function handleAssign(demandRowId: string, engineerId: string, customHoursPerWeek?: number) {
    const existing = projectAssignments.find(a => a.demandRowId === demandRowId && a.engineerId === engineerId);
    if (existing) return;
    const dr = rows.find(r => r.id === demandRowId);
    if (!dr) return;
    const assignmentHours = dr.weeklyHours.map(wh => {
      const available = getEngineerAvailableHours(engineerId, wh.weekCommencing, engineers, assignments);
      // Remaining gap for this week after existing assignments
      const alreadyAssigned = projectAssignments
        .filter(a => a.demandRowId === demandRowId)
        .reduce((s, a) => {
          const awh = a.weeklyHours.find(w => w.weekCommencing === wh.weekCommencing);
          return s + (awh?.hours ?? 0);
        }, 0);
      const gap = Math.max(0, wh.hours - alreadyAssigned);
      const maxHours = Math.min(gap, available);
      const hours = customHoursPerWeek !== undefined
        ? Math.min(customHoursPerWeek, maxHours)
        : maxHours;
      return { weekCommencing: wh.weekCommencing, hours };
    });
    addAssignment({
      id: genId(), projectId: id!, demandRowId, engineerId,
      weeklyHours: assignmentHours, status: 'tentative',
    });
    // Clear custom hours after assigning
    const key = `${demandRowId}:${engineerId}`;
    setCustomHoursMap(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  function handleSubmitForApproval() {
    updateProject(id!, { status: 'pending_approval' });
    navigate('/projects');
  }

  // Group rows by phase for display
  const phaseIds = [...new Set(rows.map(r => r.phaseId))];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <button onClick={() => navigate('/projects')} style={backBtn}>← Projects</button>
          <h1 style={h1}>{project.name}</h1>
          <p style={sub}>{formatDateRange(project.startDate, project.endDate)}</p>
          {project.phases.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
              {project.phases.map(ph => (
                <span key={ph.id} style={{
                  fontSize: '11px', fontWeight: 590, padding: '2px 8px', borderRadius: '4px',
                  background: 'rgba(94,106,210,0.15)', color: '#7170ff',
                }}>
                  {ph.name} · {ph.fundingType}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleSubmitForApproval}
          disabled={!allCovered}
          style={{ ...primaryBtn, opacity: allCovered ? 1 : 0.4, cursor: allCovered ? 'pointer' : 'not-allowed' }}
        >
          Submit for Approval
        </button>
      </div>

      {!allCovered && rows.length > 0 && (
        <div style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '16px', padding: '8px 12px',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '6px' }}>
          All demand must be fully covered before submitting for approval.
          Assign enough engineers so every week's hours are met.
        </div>
      )}

      {/* Demand Coverage heat map */}
      <CapacityPanel
        demandRows={rows}
        weeks={weeks}
        engineers={engineers}
        skillLevels={skillLevels}
        assignments={assignments}
        projectId={id!}
        allSkills={skills}
        allThemes={themes}
      />

      {/* Demand Forecast grouped by phase */}
      {phaseIds.map(phaseId => {
        const phase = project.phases.find(p => p.id === phaseId);
        const phaseRows = rows.filter(r => r.phaseId === phaseId);
        const phaseWeeks = phase ? getProjectWeeks(phase.startDate, phase.endDate) : weeks;

        const gridRows: GridRow[] = phaseRows.map(r => {
          const skill = skills.find(s => s.id === r.skillId);
          const theme = themes.find(t => t.id === skill?.themeId);
          const reqLevel = r.requiredSkillLevelId ? skillLevels.find(l => l.id === r.requiredSkillLevelId) : null;
          return {
            id: r.id,
            skillName: skill?.name || r.skillId,
            themeName: theme?.name ?? '',
            requiredLevelLabel: reqLevel?.label,
            description: r.label || undefined,
          };
        });

        const weeklyHoursMap: Record<string, Record<string, number>> = {};
        phaseRows.forEach(r => {
          weeklyHoursMap[r.id] = Object.fromEntries(r.weeklyHours.map(wh => [wh.weekCommencing, wh.hours]));
        });

        return (
          <div key={phaseId} style={{ marginBottom: '28px' }}>
            <h2 style={sectionHead}>
              {phase ? `${phase.name} — ${phase.fundingType}` : 'Demand Forecast'}
            </h2>
            {phase && (
              <p style={hint}>{phase.startDate} – {phase.endDate}</p>
            )}
            <WeeklyGrid weeks={phaseWeeks} rows={gridRows} weeklyHours={weeklyHoursMap} readOnly showTotals />
          </div>
        );
      })}

      {/* Assign engineers */}
      <h2 style={sectionHead}>Assign Engineers</h2>
      <p style={hint}>
        Assignment hours are automatically capped to each engineer's available capacity per week.
        Multiple engineers can be assigned to share demand. Coverage updates live in the panel above.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {rows.map(dr => {
          const skill = skills.find(s => s.id === dr.skillId);
          const theme = themes.find(t => t.id === skill?.themeId);
          const phase = project.phases.find(p => p.id === dr.phaseId);
          const reqLevel = dr.requiredSkillLevelId ? skillLevels.find(l => l.id === dr.requiredSkillLevelId) : null;
          const qualified = getQualifiedEngineers(dr.skillId, dr.requiredSkillLevelId, engineers, skillLevels);
          const rowAssignments = projectAssignments.filter(a => a.demandRowId === dr.id);
          const assignedIds = new Set(rowAssignments.map(a => a.engineerId));

          const totalDemandHours = dr.weeklyHours.reduce((s, wh) => s + wh.hours, 0);
          const rawAssignedHours = rowAssignments.reduce((s, a) => s + a.weeklyHours.reduce((ss, wh) => ss + wh.hours, 0), 0);
          const assignedHours = Math.min(rawAssignedHours, totalDemandHours);
          const gapHours = Math.max(0, totalDemandHours - assignedHours);
          const coverPct = totalDemandHours > 0 ? Math.min(100, Math.round(assignedHours / totalDemandHours * 100)) : 0;

          const rowWeeks = dr.weeklyHours.map(wh => wh.weekCommencing);

          return (
            <div key={dr.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 590, color: '#f7f8f8' }}>
                    {skill?.name || dr.skillId}
                    {reqLevel && <span style={{ fontSize: '12px', color: '#8a8f98', fontWeight: 400, marginLeft: '8px' }}>min {reqLevel.label}</span>}
                  </div>
                  {dr.label && (
                    <div style={{ fontSize: '12px', color: '#8a8f98', fontStyle: 'italic', marginTop: '1px' }}>{dr.label}</div>
                  )}
                  <div style={{ fontSize: '12px', color: '#62666d' }}>
                    {theme?.name}
                    {phase && <span style={{ marginLeft: '8px', color: '#5e6ad2' }}>{phase.name}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '130px' }}>
                  <div style={{ fontSize: '12px', color: gapHours === 0 ? '#27a644' : '#f59e0b', fontWeight: 590 }}>
                    {gapHours === 0 ? '✓ Fully covered' : `${gapHours}h gap remaining`}
                  </div>
                  <div style={{ fontSize: '11px', color: '#62666d', marginTop: '2px' }}>
                    {assignedHours}h of {totalDemandHours}h assigned
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '5px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px', width: `${coverPct}%`,
                      background: coverPct === 100 ? '#27a644' : coverPct > 0 ? '#f59e0b' : '#ef4444',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              </div>

              {rowAssignments.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#8a8f98', fontWeight: 510, textTransform: 'uppercase', marginBottom: '6px' }}>Assigned</div>
                  {rowAssignments.map(a => {
                    const eng = engineers.find(e => e.id === a.engineerId);
                    const aTotal = a.weeklyHours.reduce((s, wh) => s + wh.hours, 0);
                    // An engineer is partial if they don't cover the full remaining demand themselves
                    const isPartial = rowAssignments.length > 1 || aTotal < totalDemandHours;
                    return (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 10px',
                        background: isPartial ? 'rgba(245,158,11,0.08)' : 'rgba(39,166,68,0.1)',
                        border: `1px solid ${isPartial ? 'rgba(245,158,11,0.2)' : 'rgba(39,166,68,0.15)'}`,
                        borderRadius: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', color: '#d0d6e0' }}>{eng?.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: isPartial ? '#f59e0b' : '#8a8f98' }}>
                            {aTotal}h total {isPartial ? '(partial)' : ''}
                          </span>
                          <button onClick={() => removeAssignment(a.id)} style={removeBtn}>Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ fontSize: '11px', color: '#8a8f98', fontWeight: 510, textTransform: 'uppercase', marginBottom: '6px' }}>
                Available Engineers ({qualified.filter(e => !assignedIds.has(e.id)).length})
              </div>
              {qualified.length === 0 && (
                <div style={{ fontSize: '13px', color: '#62666d' }}>No qualified engineers for this skill.</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {qualified.filter(e => !assignedIds.has(e.id)).map(eng => {
                  const engSkill = eng.skills.find(s => s.skillId === dr.skillId);
                  const engLevel = engSkill ? skillLevels.find(l => l.id === engSkill.skillLevelId) : null;
                  const customKey = `${dr.id}:${eng.id}`;

                  // Per-week availability for this engineer during the demand period
                  const weeklyAvail = rowWeeks.map(w => getEngineerAvailableHours(eng.id, w, engineers, assignments));
                  const minAvail = weeklyAvail.length ? Math.min(...weeklyAvail) : 0;
                  const maxAvail = weeklyAvail.length ? Math.max(...weeklyAvail) : 0;
                  const availDisplay = minAvail === maxAvail ? `${minAvail}h/wk` : `${minAvail}–${maxAvail}h/wk`;

                  // Remaining gap per week (after existing assignments to this demand row)
                  const weeklyGap = dr.weeklyHours.map((wh) => {
                    const alreadyAssigned = rowAssignments.reduce((s, a) => {
                      const awh = a.weeklyHours.find(w => w.weekCommencing === wh.weekCommencing);
                      return s + (awh?.hours ?? 0);
                    }, 0);
                    return Math.max(0, wh.hours - alreadyAssigned);
                  });
                  const maxContributionPerWeek = dr.weeklyHours.reduce((maxH, _wh, i) => {
                    return Math.max(maxH, Math.min(weeklyGap[i], weeklyAvail[i] ?? 0));
                  }, 0);
                  const wouldFullyCover = dr.weeklyHours.every((_wh, i) => (weeklyAvail[i] ?? 0) >= weeklyGap[i]);
                  const customHours = customHoursMap[customKey];

                  return (
                    <div key={eng.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${wouldFullyCover ? 'rgba(39,166,68,0.2)' : minAvail === 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '6px' }}>
                      <div>
                        <span style={{ fontSize: '13px', color: '#d0d6e0', fontWeight: 510 }}>{eng.name}</span>
                        <span style={{ fontSize: '11px', color: '#8a8f98', marginLeft: '8px' }}>{engLevel?.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: minAvail === 0 ? '#ef4444' : '#62666d' }}>
                            {availDisplay} available
                          </div>
                          {wouldFullyCover && gapHours > 0 && (
                            <div style={{ fontSize: '10px', color: '#27a644' }}>covers remaining gap</div>
                          )}
                          {minAvail === 0 && maxAvail === 0 && (
                            <div style={{ fontSize: '10px', color: '#ef4444' }}>no capacity this period</div>
                          )}
                        </div>
                        {maxAvail > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              min={1}
                              max={maxContributionPerWeek || maxAvail}
                              value={customHours ?? ''}
                              onChange={e => {
                                const v = parseInt(e.target.value) || undefined;
                                setCustomHoursMap(prev => v !== undefined ? { ...prev, [customKey]: v } : (() => { const n = { ...prev }; delete n[customKey]; return n; })());
                              }}
                              placeholder="h/wk"
                              title="Optional: specify hours per week (leave blank for auto)"
                              style={{
                                width: '56px', background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px',
                                color: '#d0d6e0', fontSize: '11px', padding: '3px 6px', outline: 'none', textAlign: 'center',
                              }}
                            />
                            <span style={{ fontSize: '10px', color: '#62666d' }}>h/wk</span>
                          </div>
                        )}
                        <button
                          onClick={() => handleAssign(dr.id, eng.id, customHours)}
                          disabled={minAvail === 0 && maxAvail === 0}
                          style={{ ...assignBtn, opacity: minAvail === 0 && maxAvail === 0 ? 0.4 : 1,
                            cursor: minAvail === 0 && maxAvail === 0 ? 'not-allowed' : 'pointer' }}
                        >
                          Assign →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const h1: React.CSSProperties = { fontSize: '24px', fontWeight: 590, color: '#f7f8f8', letterSpacing: '-0.03em', margin: '4px 0 4px' };
const sub: React.CSSProperties = { fontSize: '13px', color: '#8a8f98', margin: 0 };
const hint: React.CSSProperties = { fontSize: '12px', color: '#62666d', margin: '-6px 0 12px' };
const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#62666d', fontSize: '13px', cursor: 'pointer', padding: '0 0 8px', display: 'block' };
const primaryBtn: React.CSSProperties = { background: '#5e6ad2', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 510 };
const sectionHead: React.CSSProperties = { fontSize: '13px', fontWeight: 590, color: '#8a8f98', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 6px' };
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px' };
const removeBtn: React.CSSProperties = { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' };
const assignBtn: React.CSSProperties = { background: 'rgba(94,106,210,0.15)', color: '#7170ff', border: '1px solid rgba(94,106,210,0.3)', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', fontWeight: 510, cursor: 'pointer' };
