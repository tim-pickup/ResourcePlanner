import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { FundingType, DemandRow, ProjectPhase } from '../types';
import WeeklyGrid, { GridRow } from '../components/WeeklyGrid';
import { getProjectWeeks, genId } from '../utils/dates';

type Step = 1 | 2;

interface LocalPhase {
  phaseId: string;
  name: string;
  startDate: string;
  endDate: string;
  fundingType: FundingType;
}

interface LocalDemandRow {
  rowId: string;
  phaseId: string;
  skillId: string;
  label: string;
  requiredSkillLevelId: string | null;
}

function makePhase(n: number): LocalPhase {
  return { phaseId: genId(), name: `Phase ${n}`, startDate: '', endDate: '', fundingType: 'Group Strategy Funded' };
}

export default function NewProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const { projects, themes, skills, skillLevels, currentUserId, addProject, updateProject, setProjectDemandRows, demandRows } = useStore();

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phases, setPhases] = useState<LocalPhase[]>([makePhase(1)]);
  const [rowDefs, setRowDefs] = useState<LocalDemandRow[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<Record<string, Record<string, number>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!editId) return;
    const p = projects.find(pr => pr.id === editId);
    if (!p) return;
    setName(p.name);
    setDescription(p.description);
    setPhases(p.phases.map(ph => ({
      phaseId: ph.id, name: ph.name,
      startDate: ph.startDate, endDate: ph.endDate, fundingType: ph.fundingType,
    })));
    const rows = demandRows.filter(r => r.projectId === editId);
    setRowDefs(rows.map(r => ({
      rowId: r.id, phaseId: r.phaseId, skillId: r.skillId,
      label: r.label ?? '', requiredSkillLevelId: r.requiredSkillLevelId,
    })));
    const hrs: Record<string, Record<string, number>> = {};
    rows.forEach(r => { hrs[r.id] = Object.fromEntries(r.weeklyHours.map(wh => [wh.weekCommencing, wh.hours])); });
    setWeeklyHours(hrs);
  }, [editId]);

  const activeThemes = themes.filter(t => t.isActive);
  const activeSkills = skills.filter(s => s.isActive);

  function addPhase() {
    setPhases(prev => [...prev, makePhase(prev.length + 1)]);
  }
  function removePhase(phaseId: string) {
    setPhases(prev => prev.filter(p => p.phaseId !== phaseId));
    setRowDefs(prev => prev.filter(r => r.phaseId !== phaseId));
  }
  function updatePhase(phaseId: string, patch: Partial<LocalPhase>) {
    setPhases(prev => prev.map(p => p.phaseId === phaseId ? { ...p, ...patch } : p));
  }

  function addDemandRow(phaseId: string) {
    const firstSkill = activeSkills[0];
    if (!firstSkill) return;
    setRowDefs(prev => [...prev, { rowId: genId(), phaseId, skillId: firstSkill.id, label: '', requiredSkillLevelId: null }]);
  }
  function removeRow(rowId: string) {
    setRowDefs(prev => prev.filter(r => r.rowId !== rowId));
    setWeeklyHours(prev => { const n = { ...prev }; delete n[rowId]; return n; });
  }
  function updateRow(rowId: string, patch: Partial<LocalDemandRow>) {
    setRowDefs(prev => prev.map(r => r.rowId === rowId ? { ...r, ...patch } : r));
  }
  function handleHoursChange(rowId: string, week: string, hours: number) {
    setWeeklyHours(prev => ({ ...prev, [rowId]: { ...(prev[rowId] ?? {}), [week]: hours } }));
  }

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Project name is required';
    if (phases.length === 0) e.phases = 'At least one phase is required';
    phases.forEach((ph, i) => {
      if (!ph.startDate) e[`ph${i}s`] = 'Required';
      if (!ph.endDate) e[`ph${i}e`] = 'Required';
      if (ph.startDate && ph.endDate && ph.endDate <= ph.startDate) e[`ph${i}e`] = 'Must be after start';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function buildSaveData(projectId: string) {
    const phaseObjects: ProjectPhase[] = phases.map(ph => ({
      id: ph.phaseId, name: ph.name,
      startDate: ph.startDate, endDate: ph.endDate, fundingType: ph.fundingType,
    }));
    const sorted = [...phases].filter(p => p.startDate && p.endDate);
    const startDate = sorted.length ? sorted.reduce((a, b) => a.startDate < b.startDate ? a : b).startDate : '';
    const endDate = sorted.length ? sorted.reduce((a, b) => a.endDate > b.endDate ? a : b).endDate : '';

    const rows: DemandRow[] = rowDefs.map(def => {
      const ph = phases.find(p => p.phaseId === def.phaseId);
      const phWeeks = ph?.startDate && ph?.endDate ? getProjectWeeks(ph.startDate, ph.endDate) : [];
      return {
        id: def.rowId, projectId, phaseId: def.phaseId,
        skillId: def.skillId,
        label: def.label || undefined,
        requiredSkillLevelId: def.requiredSkillLevelId,
        weeklyHours: phWeeks.map(w => ({ weekCommencing: w, hours: weeklyHours[def.rowId]?.[w] ?? 0 })),
      };
    });
    return { phases: phaseObjects, startDate, endDate, rows };
  }

  function save(status: 'draft' | 'submitted') {
    if (!validateStep1()) { setStep(1); return; }
    if (editId) {
      const { phases: phaseObjects, startDate, endDate, rows } = buildSaveData(editId);
      updateProject(editId, { name, description, startDate, endDate, phases: phaseObjects, status,
        submittedAt: status === 'submitted' ? new Date().toISOString() : undefined });
      setProjectDemandRows(editId, rows);
    } else {
      const id = genId();
      const { phases: phaseObjects, startDate, endDate, rows } = buildSaveData(id);
      addProject({ id, name, description, startDate, endDate, phases: phaseObjects,
        createdByUserId: currentUserId, status, rejectionReason: '',
        submittedAt: status === 'submitted' ? new Date().toISOString() : null });
      setProjectDemandRows(id, rows);
    }
    navigate('/projects');
  }

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={h1}>{editId ? 'Edit Project' : 'New Project'}</h1>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          {([1, 2] as const).map(s => (
            <div key={s} style={{
              padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 510,
              background: step === s ? 'rgba(94,106,210,0.2)' : 'rgba(255,255,255,0.04)',
              color: step === s ? '#7170ff' : '#62666d',
              border: `1px solid ${step === s ? 'rgba(94,106,210,0.4)' : 'rgba(255,255,255,0.08)'}`,
            }}>
              {s === 1 ? '1. Project & Phases' : '2. Demand Forecast'}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div style={card}>
          <Field label="Project Name" error={errors.name} required>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. MOM Phase 3 Rollout" style={inp} />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional project description…" rows={3}
              style={{ ...inp, resize: 'vertical', height: 'auto' }} />
          </Field>

          <div style={{ marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 510, color: '#8a8f98' }}>
                Project Phases <span style={{ color: '#ef4444' }}>*</span>
              </span>
              <button onClick={addPhase} style={ghostBtn}>+ Add Phase</button>
            </div>
            {errors.phases && <div style={errStyle}>{errors.phases}</div>}

            {phases.map((ph, i) => (
              <div key={ph.phaseId} style={{ ...card, marginBottom: '12px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                  <input
                    value={ph.name}
                    onChange={e => updatePhase(ph.phaseId, { name: e.target.value })}
                    placeholder={`Phase ${i + 1} name`}
                    style={{ ...inp, flex: 1, fontSize: '13px', fontWeight: 590 }}
                  />
                  {phases.length > 1 && (
                    <button onClick={() => removePhase(ph.phaseId)} style={removeBtn}>Remove</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={lbl}>Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="date" value={ph.startDate}
                      onChange={e => updatePhase(ph.phaseId, { startDate: e.target.value })} style={inp} />
                    {errors[`ph${i}s`] && <div style={errStyle}>{errors[`ph${i}s`]}</div>}
                  </div>
                  <div>
                    <label style={lbl}>End Date <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="date" value={ph.endDate}
                      onChange={e => updatePhase(ph.phaseId, { endDate: e.target.value })} style={inp} />
                    {errors[`ph${i}e`] && <div style={errStyle}>{errors[`ph${i}e`]}</div>}
                  </div>
                  <div>
                    <label style={lbl}>Funding</label>
                    <select value={ph.fundingType}
                      onChange={e => updatePhase(ph.phaseId, { fundingType: e.target.value as FundingType })}
                      style={inp}>
                      <option>Group Strategy Funded</option>
                      <option>Sector Funded</option>
                      <option>Business Funded</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button onClick={() => { if (validateStep1()) setStep(2); }} style={primaryBtn}>
              Next: Demand Forecast →
            </button>
            <button onClick={() => save('draft')} style={ghostBtn}>Save as Draft</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          {phases.map(ph => {
            const phWeeks = ph.startDate && ph.endDate && ph.endDate > ph.startDate
              ? getProjectWeeks(ph.startDate, ph.endDate) : [];
            const phRows = rowDefs.filter(r => r.phaseId === ph.phaseId);
            const gridRows: GridRow[] = phRows.map(def => {
              const skill = activeSkills.find(s => s.id === def.skillId);
              const theme = activeThemes.find(t => t.id === skill?.themeId);
              const reqLevel = def.requiredSkillLevelId ? skillLevels.find(l => l.id === def.requiredSkillLevelId) : null;
              return {
                id: def.rowId,
                skillName: def.label || skill?.name || def.skillId,
                themeName: theme?.name ?? '',
                requiredLevelLabel: reqLevel?.label,
              };
            });

            return (
              <div key={ph.phaseId} style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 590, color: '#f7f8f8' }}>{ph.name}</span>
                    <span style={{ fontSize: '12px', color: '#62666d', marginLeft: '10px' }}>
                      {ph.startDate} – {ph.endDate}
                    </span>
                    <span style={{
                      marginLeft: '8px', fontSize: '11px', fontWeight: 590, padding: '2px 7px',
                      borderRadius: '4px', background: 'rgba(94,106,210,0.15)', color: '#7170ff',
                    }}>
                      {ph.fundingType}
                    </span>
                  </div>
                  <button onClick={() => addDemandRow(ph.phaseId)} style={ghostBtn}>+ Add Skill Row</button>
                </div>

                {phRows.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                    {phRows.map(def => {
                      const skill = activeSkills.find(s => s.id === def.skillId);
                      return (
                        <div key={def.rowId} style={{
                          display: 'flex', gap: '8px', alignItems: 'center',
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '6px', padding: '8px 10px',
                        }}>
                          <select value={def.skillId} onChange={e => updateRow(def.rowId, { skillId: e.target.value })}
                            style={{ ...sel, minWidth: '150px' }}>
                            {activeThemes.map(t => (
                              <optgroup key={t.id} label={t.name}>
                                {activeSkills.filter(s => s.themeId === t.id).map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          <select value={def.requiredSkillLevelId ?? ''}
                            onChange={e => updateRow(def.rowId, { requiredSkillLevelId: e.target.value || null })}
                            style={{ ...sel, minWidth: '110px' }}>
                            <option value="">Any level</option>
                            {skillLevels.sort((a,b) => a.rank - b.rank).map(l => (
                              <option key={l.id} value={l.id}>{l.label}+</option>
                            ))}
                          </select>
                          <input
                            value={def.label}
                            onChange={e => updateRow(def.rowId, { label: e.target.value })}
                            placeholder={`Label, e.g. "Senior ${skill?.name ?? ''}"`}
                            style={{ ...sel, flex: 1, fontSize: '12px' }}
                          />
                          <button onClick={() => removeRow(def.rowId)} style={removeBtn}>×</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {phWeeks.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#f59e0b', padding: '8px 0' }}>
                    Set valid phase dates in Step 1 to enter demand hours.
                  </div>
                ) : phRows.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#62666d', padding: '8px 0' }}>
                    No skill rows — click "+ Add Skill Row" above.
                  </div>
                ) : (
                  <WeeklyGrid
                    weeks={phWeeks} rows={gridRows}
                    weeklyHours={weeklyHours}
                    onChange={handleHoursChange} showTotals
                  />
                )}
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => save('submitted')} style={primaryBtn}>Submit Project</button>
            <button onClick={() => save('draft')} style={ghostBtn}>Save as Draft</button>
            <button onClick={() => setStep(1)} style={ghostBtn}>← Back</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, error, required }: { label: string; children: React.ReactNode; error?: string; required?: boolean }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 510, color: '#8a8f98', marginBottom: '6px' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
      {error && <div style={errStyle}>{error}</div>}
    </div>
  );
}

const h1: React.CSSProperties = { fontSize: '24px', fontWeight: 590, color: '#f7f8f8', letterSpacing: '-0.03em', margin: 0 };
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '20px' };
const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#d0d6e0', fontSize: '14px', padding: '8px 12px', outline: 'none', boxSizing: 'border-box' };
const sel: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#d0d6e0', fontSize: '13px', padding: '6px 10px', outline: 'none' };
const primaryBtn: React.CSSProperties = { background: '#5e6ad2', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 510, cursor: 'pointer' };
const ghostBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', color: '#d0d6e0', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 510, cursor: 'pointer' };
const removeBtn: React.CSSProperties = { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', color: '#8a8f98', fontWeight: 510, marginBottom: '4px' };
const errStyle: React.CSSProperties = { fontSize: '11px', color: '#ef4444', marginTop: '3px' };
