import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import WeeklyGrid, { GridRow } from '../components/WeeklyGrid';
import CapacityPanel from '../components/CapacityPanel';
import { getProjectWeeks, formatDateRange, genId } from '../utils/dates';
import { getQualifiedEngineers, getEngineerAvailableHours } from '../utils/capacity';

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useStore();
  const { projects, demandRows, assignments, engineers, skills, themes, skillLevels, updateProject, addAssignment, removeAssignment } = store;

  const project = projects.find(p => p.id === id);
  if (!project) return <div style={{ color: '#ef4444', padding: '32px' }}>Project not found.</div>;

  const rows = demandRows.filter(r => r.projectId === id);
  const weeks = getProjectWeeks(project.startDate, project.endDate);
  const projectAssignments = assignments.filter(a => a.projectId === id);

  const gridRows: GridRow[] = rows.map(r => {
    const skill = skills.find(s => s.id === r.skillId);
    const theme = themes.find(t => t.id === skill?.themeId);
    const reqLevel = r.requiredSkillLevelId ? skillLevels.find(l => l.id === r.requiredSkillLevelId) : null;
    return { id: r.skillId, skillName: skill?.name ?? r.skillId, themeName: theme?.name ?? '', requiredLevelLabel: reqLevel?.label };
  });

  const weeklyHours: Record<string, Record<string, number>> = {};
  rows.forEach(r => {
    weeklyHours[r.skillId] = Object.fromEntries(r.weeklyHours.map(wh => [wh.weekCommencing, wh.hours]));
  });

  const capacitySkills = rows.map(r => ({ skillId: r.skillId, requiredSkillLevelId: r.requiredSkillLevelId }));

  const allAssigned = rows.every(r => projectAssignments.some(a => a.demandRowId === r.id));

  function handleAssign(demandRowId: string, engineerId: string) {
    const existing = projectAssignments.find(a => a.demandRowId === demandRowId && a.engineerId === engineerId);
    if (existing) return;
    const dr = rows.find(r => r.id === demandRowId);
    if (!dr) return;
    addAssignment({
      id: genId(),
      projectId: id!,
      demandRowId,
      engineerId,
      weeklyHours: dr.weeklyHours.map(wh => ({ weekCommencing: wh.weekCommencing, hours: wh.hours })),
      status: 'tentative',
    });
  }

  function handleSubmitForApproval() {
    updateProject(id!, { status: 'pending_approval' });
    navigate('/review');
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <button onClick={() => navigate('/review')} style={backBtn}>← Review Queue</button>
          <h1 style={h1}>{project.name}</h1>
          <p style={sub}>{formatDateRange(project.startDate, project.endDate)} · {project.fundingType}</p>
        </div>
        <button
          onClick={handleSubmitForApproval}
          disabled={!allAssigned}
          style={{ ...primaryBtn, opacity: allAssigned ? 1 : 0.4, cursor: allAssigned ? 'pointer' : 'not-allowed' }}
        >
          Submit for Approval
        </button>
      </div>

      <CapacityPanel
        skills={capacitySkills} weeks={weeks} demandRows={rows}
        engineers={engineers} skillLevels={skillLevels} assignments={assignments}
        allSkills={skills} allThemes={themes}
      />

      <h2 style={sectionHead}>Demand Forecast</h2>
      <div style={{ marginBottom: '28px' }}>
        <WeeklyGrid weeks={weeks} rows={gridRows} weeklyHours={weeklyHours} readOnly showTotals />
      </div>

      <h2 style={sectionHead}>Engineer Assignments</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {rows.map(dr => {
          const skill = skills.find(s => s.id === dr.skillId);
          const theme = themes.find(t => t.id === skill?.themeId);
          const reqLevel = dr.requiredSkillLevelId ? skillLevels.find(l => l.id === dr.requiredSkillLevelId) : null;
          const qualified = getQualifiedEngineers(dr.skillId, dr.requiredSkillLevelId, engineers, skillLevels);
          const rowAssignments = projectAssignments.filter(a => a.demandRowId === dr.id);
          const assignedIds = new Set(rowAssignments.map(a => a.engineerId));

          return (
            <div key={dr.id} style={card}>
              <div style={{ fontSize: '14px', fontWeight: 590, color: '#f7f8f8', marginBottom: '4px' }}>
                {skill?.name}
                {reqLevel && <span style={{ fontSize: '12px', color: '#8a8f98', fontWeight: 400, marginLeft: '8px' }}>min {reqLevel.label}</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#62666d', marginBottom: '12px' }}>{theme?.name}</div>

              {rowAssignments.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#8a8f98', fontWeight: 510, textTransform: 'uppercase', marginBottom: '6px' }}>Assigned</div>
                  {rowAssignments.map(a => {
                    const eng = engineers.find(e => e.id === a.engineerId);
                    return (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 10px', background: 'rgba(39,166,68,0.1)', borderRadius: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', color: '#d0d6e0' }}>{eng?.name}</span>
                        <button onClick={() => removeAssignment(a.id)} style={removeBtn}>Remove</button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ fontSize: '11px', color: '#8a8f98', fontWeight: 510, textTransform: 'uppercase', marginBottom: '6px' }}>
                Available Engineers ({qualified.length})
              </div>
              {qualified.length === 0 && (
                <div style={{ fontSize: '13px', color: '#62666d' }}>No qualified engineers available.</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {qualified.filter(e => !assignedIds.has(e.id)).map(eng => {
                  const engSkill = eng.skills.find(s => s.skillId === dr.skillId);
                  const engLevel = engSkill ? skillLevels.find(l => l.id === engSkill.skillLevelId) : null;
                  const minAvail = Math.min(...weeks.map(w => getEngineerAvailableHours(eng.id, w, engineers, assignments)));
                  return (
                    <div key={eng.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '6px' }}>
                      <div>
                        <span style={{ fontSize: '13px', color: '#d0d6e0', fontWeight: 510 }}>{eng.name}</span>
                        <span style={{ fontSize: '11px', color: '#8a8f98', marginLeft: '8px' }}>{engLevel?.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#62666d' }}>min {minAvail}h/wk avail.</span>
                        <button onClick={() => handleAssign(dr.id, eng.id)} style={assignBtn}>Assign</button>
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
const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#62666d', fontSize: '13px', cursor: 'pointer', padding: '0 0 8px', display: 'block' };
const primaryBtn: React.CSSProperties = { background: '#5e6ad2', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 510 };
const sectionHead: React.CSSProperties = { fontSize: '13px', fontWeight: 590, color: '#8a8f98', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 12px' };
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px' };
const removeBtn: React.CSSProperties = { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' };
const assignBtn: React.CSSProperties = { background: 'rgba(94,106,210,0.15)', color: '#7170ff', border: '1px solid rgba(94,106,210,0.3)', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', fontWeight: 510, cursor: 'pointer' };
