import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import WeeklyGrid, { GridRow } from '../components/WeeklyGrid';
import CapacityPanel from '../components/CapacityPanel';
import StatusBadge from '../components/StatusBadge';
import { getProjectWeeks, formatDateRange } from '../utils/dates';

export default function ApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, demandRows, assignments, engineers, skills, themes, skillLevels,
    updateProject, lockProjectAssignments, removeTentativeAssignments } = useStore();

  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const project = projects.find(p => p.id === id);
  if (!project) return <div style={{ color: '#ef4444', padding: '32px' }}>Project not found.</div>;

  const rows = demandRows.filter(r => r.projectId === id);
  const weeks = getProjectWeeks(project.startDate, project.endDate);
  const projectAssignments = assignments.filter(a => a.projectId === id);

  const gridRows: GridRow[] = rows.map(r => {
    const skill = skills.find(s => s.id === r.skillId);
    const theme = themes.find(t => t.id === skill?.themeId);
    const reqLevel = r.requiredSkillLevelId ? skillLevels.find(l => l.id === r.requiredSkillLevelId) : null;
    return { id: r.id, skillName: r.label || skill?.name || r.skillId, themeName: theme?.name ?? '', requiredLevelLabel: reqLevel?.label };
  });

  const weeklyHours: Record<string, Record<string, number>> = {};
  rows.forEach(r => {
    weeklyHours[r.id] = Object.fromEntries(r.weeklyHours.map(wh => [wh.weekCommencing, wh.hours]));
  });

  function handleApprove() {
    lockProjectAssignments(id!);
    updateProject(id!, { status: 'approved' });
    navigate('/approval');
  }

  function handleReject() {
    if (!rejectionReason.trim()) { setRejectError('Rejection reason is required'); return; }
    removeTentativeAssignments(id!);
    updateProject(id!, { status: 'rejected', rejectionReason: rejectionReason.trim() });
    navigate('/approval');
  }

  const assignmentSummary = projectAssignments.reduce((acc, a) => {
    const eng = engineers.find(e => e.id === a.engineerId);
    if (eng && !acc.includes(eng.name)) acc.push(eng.name);
    return acc;
  }, [] as string[]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <button onClick={() => navigate('/approval')} style={backBtn}>← Approval Queue</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={h1}>{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p style={sub}>
            {formatDateRange(project.startDate, project.endDate)}
            {project.phases.length === 1
              ? ` · ${project.phases[0].fundingType}`
              : project.phases.length > 1
              ? ` · ${project.phases.length} phases`
              : ''}
          </p>
          {assignmentSummary.length > 0 && (
            <p style={{ fontSize: '12px', color: '#8a8f98', margin: '4px 0 0' }}>
              Assigned: {assignmentSummary.join(', ')}
            </p>
          )}
        </div>

        {project.status === 'pending_approval' && !rejecting && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleApprove} style={approveBtn}>✓ Approve</button>
            <button onClick={() => setRejecting(true)} style={rejectBtnStyle}>✗ Reject</button>
          </div>
        )}
      </div>

      {rejecting && (
        <div style={{ ...card, marginBottom: '24px', borderColor: 'rgba(239,68,68,0.3)' }}>
          <div style={{ fontSize: '14px', fontWeight: 590, color: '#f87171', marginBottom: '12px' }}>Reject Project</div>
          <label style={{ fontSize: '12px', color: '#8a8f98', display: 'block', marginBottom: '6px' }}>
            Rejection reason <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={rejectionReason}
            onChange={e => { setRejectionReason(e.target.value); setRejectError(''); }}
            rows={3}
            placeholder="Explain why this project is being rejected…"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          {rejectError && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{rejectError}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button onClick={handleReject} style={rejectBtnStyle}>Confirm Rejection</button>
            <button onClick={() => { setRejecting(false); setRejectionReason(''); setRejectError(''); }} style={ghostBtn}>Cancel</button>
          </div>
        </div>
      )}

      <CapacityPanel
        demandRows={rows}
        weeks={weeks}
        engineers={engineers} skillLevels={skillLevels} assignments={assignments}
        projectId={id!}
        allSkills={skills} allThemes={themes}
      />

      <h2 style={sectionHead}>Demand Forecast</h2>
      <div style={{ marginBottom: '28px' }}>
        <WeeklyGrid weeks={weeks} rows={gridRows} weeklyHours={weeklyHours} readOnly showTotals />
      </div>

      <h2 style={sectionHead}>Engineer Assignments</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {rows.map(dr => {
          const skill = skills.find(s => s.id === dr.skillId);
          const rowAssignments = projectAssignments.filter(a => a.demandRowId === dr.id);
          return (
            <div key={dr.id} style={card}>
              <div style={{ fontSize: '13px', fontWeight: 590, color: '#d0d6e0', marginBottom: '8px' }}>
                {skill?.name}
              </div>
              {rowAssignments.length === 0 && <div style={{ fontSize: '13px', color: '#62666d' }}>No engineers assigned.</div>}
              {rowAssignments.map(a => {
                const eng = engineers.find(e => e.id === a.engineerId);
                const total = a.weeklyHours.reduce((s, w) => s + w.hours, 0);
                return (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between',
                    padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#d0d6e0' }}>{eng?.name}</span>
                    <span style={{ fontSize: '12px', color: '#8a8f98' }}>{total}h total · {a.status}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const h1: React.CSSProperties = { fontSize: '24px', fontWeight: 590, color: '#f7f8f8', letterSpacing: '-0.03em', margin: 0 };
const sub: React.CSSProperties = { fontSize: '13px', color: '#8a8f98', margin: 0 };
const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#62666d', fontSize: '13px', cursor: 'pointer', padding: '0 0 8px', display: 'block' };
const sectionHead: React.CSSProperties = { fontSize: '13px', fontWeight: 590, color: '#8a8f98', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 12px' };
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px' };
const approveBtn: React.CSSProperties = { background: 'rgba(39,166,68,0.15)', color: '#4ade80', border: '1px solid rgba(39,166,68,0.3)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 510, cursor: 'pointer' };
const rejectBtnStyle: React.CSSProperties = { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 510, cursor: 'pointer' };
const ghostBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', color: '#d0d6e0', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 510, cursor: 'pointer' };
const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#d0d6e0', fontSize: '14px', padding: '8px 12px', outline: 'none', boxSizing: 'border-box' };
