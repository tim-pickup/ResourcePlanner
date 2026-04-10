import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { FundingType, DemandRow } from '../types';
import WeeklyGrid, { GridRow } from '../components/WeeklyGrid';
import { getProjectWeeks, genId } from '../utils/dates';

type Step = 1 | 2;

export default function NewProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const { projects, themes, skills, skillLevels, currentUserId, addProject, updateProject, setProjectDemandRows, demandRows } = useStore();

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fundingType, setFundingType] = useState<FundingType>('Group Strategy Funded');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // skillId -> requiredSkillLevelId | null
  const [selectedSkills, setSelectedSkills] = useState<Record<string, string | null>>({});
  // skillId -> weekCommencing -> hours
  const [weeklyHours, setWeeklyHours] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    if (editId) {
      const p = projects.find(pr => pr.id === editId);
      if (p) {
        setName(p.name); setDescription(p.description);
        setStartDate(p.startDate); setEndDate(p.endDate);
        setFundingType(p.fundingType);
        const rows = demandRows.filter(r => r.projectId === editId);
        const sel: Record<string, string | null> = {};
        const hrs: Record<string, Record<string, number>> = {};
        rows.forEach(r => {
          sel[r.skillId] = r.requiredSkillLevelId;
          hrs[r.skillId] = Object.fromEntries(r.weeklyHours.map(wh => [wh.weekCommencing, wh.hours]));
        });
        setSelectedSkills(sel);
        setWeeklyHours(hrs);
      }
    }
  }, [editId]);

  const weeks = startDate && endDate && endDate > startDate ? getProjectWeeks(startDate, endDate) : [];
  const activeThemes = themes.filter(t => t.isActive);
  const activeSkills = skills.filter(s => s.isActive);

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Project name is required';
    if (!startDate) e.startDate = 'Start date is required';
    if (!endDate) e.endDate = 'End date is required';
    if (startDate && endDate && endDate <= startDate) e.endDate = 'End date must be after start date';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function toggleSkill(skillId: string) {
    setSelectedSkills(prev => {
      const next = { ...prev };
      if (skillId in next) { delete next[skillId]; }
      else { next[skillId] = null; }
      return next;
    });
  }

  function setRequiredLevel(skillId: string, levelId: string | null) {
    setSelectedSkills(prev => ({ ...prev, [skillId]: levelId }));
  }

  function handleHoursChange(skillId: string, week: string, hours: number) {
    setWeeklyHours(prev => ({
      ...prev,
      [skillId]: { ...(prev[skillId] ?? {}), [week]: hours },
    }));
  }

  function buildDemandRows(projectId: string): DemandRow[] {
    return Object.entries(selectedSkills).map(([skillId, requiredSkillLevelId]) => ({
      id: genId(),
      projectId,
      skillId,
      requiredSkillLevelId,
      weeklyHours: weeks.map(w => ({ weekCommencing: w, hours: weeklyHours[skillId]?.[w] ?? 0 })),
    }));
  }

  function save(status: 'draft' | 'submitted') {
    if (!validateStep1()) { setStep(1); return; }
    if (editId) {
      updateProject(editId, { name, description, startDate, endDate, fundingType, status,
        submittedAt: status === 'submitted' ? new Date().toISOString() : undefined });
      setProjectDemandRows(editId, buildDemandRows(editId));
    } else {
      const id = genId();
      addProject({ id, name, description, startDate, endDate, fundingType,
        createdByUserId: currentUserId, status, rejectionReason: '',
        submittedAt: status === 'submitted' ? new Date().toISOString() : null });
      setProjectDemandRows(id, buildDemandRows(id));
    }
    navigate('/my-projects');
  }

  const selectedSkillIds = Object.keys(selectedSkills);
  const gridRows: GridRow[] = selectedSkillIds.map(skillId => {
    const skill = activeSkills.find(s => s.id === skillId);
    const theme = activeThemes.find(t => t.id === skill?.themeId);
    const reqLevel = selectedSkills[skillId] ? skillLevels.find(l => l.id === selectedSkills[skillId]) : null;
    return { id: skillId, skillName: skill?.name ?? skillId, themeName: theme?.name ?? '', requiredLevelLabel: reqLevel?.label };
  });

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={h1}>{editId ? 'Edit Project' : 'New Project'}</h1>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          {(['1', '2'] as const).map(s => (
            <div key={s} style={{
              padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 510,
              background: step === parseInt(s) ? 'rgba(94,106,210,0.2)' : 'rgba(255,255,255,0.04)',
              color: step === parseInt(s) ? '#7170ff' : '#62666d',
              border: `1px solid ${step === parseInt(s) ? 'rgba(94,106,210,0.4)' : 'rgba(255,255,255,0.08)'}`,
            }}>
              {s === '1' ? '1. Project Details' : '2. Demand Forecast'}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div style={card}>
          <Field label="Project Name" error={errors.name} required>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. MOM Phase 3 Rollout" style={input} />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional project description…" rows={3} style={{ ...input, resize: 'vertical', height: 'auto' }} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Start Date" error={errors.startDate} required>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={input} />
            </Field>
            <Field label="End Date" error={errors.endDate} required>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={input} />
            </Field>
          </div>
          <Field label="Funding Type">
            <select value={fundingType} onChange={e => setFundingType(e.target.value as FundingType)} style={input}>
              <option>Group Strategy Funded</option>
              <option>Business Funded</option>
            </select>
          </Field>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button onClick={() => { if (validateStep1()) setStep(2); }} style={primaryBtn}>
              Next: Demand Forecast →
            </button>
            <button onClick={() => save('draft')} style={ghostBtn}>Save as Draft</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          {weeks.length === 0 && (
            <div style={{ color: '#f59e0b', fontSize: '13px', marginBottom: '16px' }}>
              Please set valid start and end dates in Step 1 first.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px' }}>
            {/* Skill tree */}
            <div style={card}>
              <div style={{ fontSize: '12px', fontWeight: 590, color: '#8a8f98', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Select Skills
              </div>
              {activeThemes.map(theme => {
                const themeSkills = activeSkills.filter(s => s.themeId === theme.id);
                return (
                  <div key={theme.id} style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 590, color: '#7170ff', marginBottom: '6px' }}>
                      {theme.name}
                    </div>
                    {themeSkills.map(skill => (
                      <label key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={skill.id in selectedSkills}
                          onChange={() => toggleSkill(skill.id)}
                          style={{ accentColor: '#5e6ad2' }}
                        />
                        <span style={{ fontSize: '13px', color: '#d0d6e0' }}>{skill.name}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Grid + levels */}
            <div>
              {selectedSkillIds.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 590, color: '#8a8f98', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    Minimum Required Levels
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedSkillIds.map(skillId => {
                      const skill = skills.find(s => s.id === skillId);
                      return (
                        <div key={skillId} style={{ display: 'flex', alignItems: 'center', gap: '6px',
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px', padding: '6px 10px' }}>
                          <span style={{ fontSize: '12px', color: '#d0d6e0' }}>{skill?.name}</span>
                          <select
                            value={selectedSkills[skillId] ?? ''}
                            onChange={e => setRequiredLevel(skillId, e.target.value || null)}
                            style={{ background: '#191a1b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px',
                              color: '#8a8f98', fontSize: '11px', padding: '2px 4px' }}
                          >
                            <option value="">Any level</option>
                            {skillLevels.sort((a,b) => a.rank - b.rank).map(l => (
                              <option key={l.id} value={l.id}>{l.label}+</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {weeks.length > 0 && (
                <WeeklyGrid
                  weeks={weeks}
                  rows={gridRows}
                  weeklyHours={weeklyHours}
                  onChange={handleHoursChange}
                  showTotals
                />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
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
      {error && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{error}</div>}
    </div>
  );
}

const h1: React.CSSProperties = { fontSize: '24px', fontWeight: 590, color: '#f7f8f8', letterSpacing: '-0.03em', margin: 0 };
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '20px' };
const input: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#d0d6e0', fontSize: '14px', padding: '8px 12px', outline: 'none', boxSizing: 'border-box' };
const primaryBtn: React.CSSProperties = { background: '#5e6ad2', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 510, cursor: 'pointer' };
const ghostBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', color: '#d0d6e0', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 510, cursor: 'pointer' };
