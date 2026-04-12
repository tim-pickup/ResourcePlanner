import { useState } from 'react';
import { useStore } from '../store';
import { genId } from '../utils/dates';
import { Engineer } from '../types';

type Tab = 'themes' | 'skills' | 'engineers' | 'levels';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('themes');

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={h1}>Admin Configuration</h1>
        <p style={sub}>Manage themes, skills, engineers, and skill levels.</p>
      </div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {(['themes', 'skills', 'engineers', 'levels'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? '#7170ff' : 'transparent'}`,
            color: tab === t ? '#f7f8f8' : '#8a8f98', fontSize: '13px', fontWeight: 510,
            padding: '8px 16px', cursor: 'pointer', textTransform: 'capitalize', marginBottom: '-1px',
          }}>
            {t === 'levels' ? 'Skill Levels' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'themes' && <ThemesTab />}
      {tab === 'skills' && <SkillsTab />}
      {tab === 'engineers' && <EngineersTab />}
      {tab === 'levels' && <LevelsTab />}
    </div>
  );
}

function ThemesTab() {
  const { themes, addTheme, updateTheme } = useStore();
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  return (
    <div style={{ maxWidth: '520px' }}>
      <div style={card}>
        {themes.map(t => (
          <div key={t.id} style={rowStyle}>
            {editId === t.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={inlineInput} />
                <button onClick={() => { updateTheme(t.id, { name: editName }); setEditId(null); }} style={saveBtn}>Save</button>
                <button onClick={() => setEditId(null)} style={cancelBtn}>Cancel</button>
              </>
            ) : (
              <>
                <span style={{ fontSize: '14px', color: t.isActive ? '#d0d6e0' : '#62666d', flex: 1 }}>{t.name}</span>
                <button onClick={() => { setEditId(t.id); setEditName(t.name); }} style={editBtn}>Edit</button>
                <button onClick={() => updateTheme(t.id, { isActive: !t.isActive })} style={t.isActive ? deactivateBtn : activateBtn}>
                  {t.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </>
            )}
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New theme name…" style={{ ...inlineInput, flex: 1 }} />
          <button onClick={() => { if (newName.trim()) { addTheme({ id: genId(), name: newName.trim(), isActive: true }); setNewName(''); } }} style={addBtn}>
            Add Theme
          </button>
        </div>
      </div>
    </div>
  );
}

function SkillsTab() {
  const { themes, skills, addSkill, updateSkill } = useStore();
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillTheme, setNewSkillTheme] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const activeThemes = themes.filter(t => t.isActive);

  return (
    <div style={{ maxWidth: '600px' }}>
      {activeThemes.map(theme => {
        const themeSkills = skills.filter(s => s.themeId === theme.id);
        return (
          <div key={theme.id} style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 590, color: '#7170ff', marginBottom: '8px' }}>{theme.name}</div>
            <div style={card}>
              {themeSkills.map(sk => (
                <div key={sk.id} style={rowStyle}>
                  {editId === sk.id ? (
                    <>
                      <input value={editName} onChange={e => setEditName(e.target.value)} style={inlineInput} />
                      <button onClick={() => { updateSkill(sk.id, { name: editName }); setEditId(null); }} style={saveBtn}>Save</button>
                      <button onClick={() => setEditId(null)} style={cancelBtn}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '13px', color: sk.isActive ? '#d0d6e0' : '#62666d', flex: 1 }}>{sk.name}</span>
                      <button onClick={() => { setEditId(sk.id); setEditName(sk.name); }} style={editBtn}>Edit</button>
                      <button onClick={() => updateSkill(sk.id, { isActive: !sk.isActive })} style={sk.isActive ? deactivateBtn : activateBtn}>
                        {sk.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </>
                  )}
                </div>
              ))}
              {themeSkills.length === 0 && <div style={{ fontSize: '13px', color: '#62666d', padding: '8px 0' }}>No skills yet.</div>}
            </div>
          </div>
        );
      })}
      <div style={{ ...card, display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={newSkillTheme} onChange={e => setNewSkillTheme(e.target.value)} style={{ ...inlineInput, minWidth: '120px' }}>
          <option value="">Select theme…</option>
          {activeThemes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input value={newSkillName} onChange={e => setNewSkillName(e.target.value)} placeholder="New skill name…" style={{ ...inlineInput, flex: 1 }} />
        <button onClick={() => {
          if (newSkillName.trim() && newSkillTheme) {
            addSkill({ id: genId(), themeId: newSkillTheme, name: newSkillName.trim(), isActive: true });
            setNewSkillName('');
          }
        }} style={addBtn}>Add Skill</button>
      </div>
    </div>
  );
}

// Engineer form with theme-correlated skill selection
function EngineerSkillEditor({
  formData,
  setFormData,
}: {
  formData: Partial<Engineer>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Engineer>>>;
}) {
  const { themes, skills, skillLevels } = useStore();
  const activeThemes = themes.filter(t => t.isActive);
  const [selectedThemeId, setSelectedThemeId] = useState(activeThemes[0]?.id ?? '');

  function setSkillLevel(skillId: string, levelId: string) {
    const cur = formData.skills ?? [];
    const exists = cur.find(s => s.skillId === skillId);
    const updated = exists
      ? cur.map(s => s.skillId === skillId ? { ...s, skillLevelId: levelId } : s)
      : [...cur, { skillId, skillLevelId: levelId }];
    setFormData(f => ({
      ...f,
      skills: levelId ? updated : cur.filter(s => s.skillId !== skillId),
    }));
  }

  const themeSkills = skills.filter(s => s.themeId === selectedThemeId && s.isActive);

  return (
    <>
      {/* Theme-scoped skill proficiencies */}
      <div style={{ marginBottom: '12px' }}>
        <label style={fieldLabel}>Skill Proficiencies</label>
        <p style={{ fontSize: '11px', color: '#62666d', margin: '0 0 8px' }}>
          Select a theme below, then set proficiency levels for its skills.
        </p>

        {/* Theme tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0' }}>
          {activeThemes.map(t => {
            const assignedCount = skills.filter(s => s.themeId === t.id && s.isActive).filter(s => formData.skills?.some(es => es.skillId === s.id)).length;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedThemeId(t.id)}
                style={{
                  background: 'none', border: 'none',
                  borderBottom: `2px solid ${selectedThemeId === t.id ? '#7170ff' : 'transparent'}`,
                  color: selectedThemeId === t.id ? '#f7f8f8' : '#8a8f98',
                  fontSize: '12px', fontWeight: 510,
                  padding: '6px 12px', cursor: 'pointer', marginBottom: '-1px',
                }}
              >
                {t.name}
                {assignedCount > 0 && (
                  <span style={{ marginLeft: '5px', fontSize: '10px', color: '#5e6ad2', background: 'rgba(94,106,210,0.15)', padding: '1px 5px', borderRadius: '8px' }}>
                    {assignedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {themeSkills.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#62666d' }}>No active skills in this theme.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '6px' }}>
            {themeSkills.map(sk => {
              const assigned = formData.skills?.find(e => e.skillId === sk.id);
              return (
                <div key={sk.id} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 10px',
                  background: assigned ? 'rgba(94,106,210,0.08)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '5px',
                  border: assigned ? '1px solid rgba(94,106,210,0.25)' : '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{ fontSize: '12px', color: '#d0d6e0', flex: 1 }}>{sk.name}</span>
                  <select
                    value={assigned?.skillLevelId ?? ''}
                    onChange={e => setSkillLevel(sk.id, e.target.value)}
                    style={{ background: '#191a1b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', color: '#8a8f98', fontSize: '11px', padding: '2px 4px' }}
                  >
                    <option value="">—</option>
                    {skillLevels.sort((a, b) => a.rank - b.rank).map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function EngineersTab() {
  const { engineers, skills, addEngineer, updateEngineer } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newMode, setNewMode] = useState(false);
  const blankEng: Partial<Engineer> = { name: '', weeklyCapacityHours: 40, isActive: true, themeIds: [], skills: [] };
  const [formData, setFormData] = useState<Partial<Engineer>>(blankEng);

  function deriveThemeIds(engSkills: { skillId: string; skillLevelId: string }[]): string[] {
    return [...new Set(
      engSkills.map(es => skills.find(s => s.id === es.skillId)?.themeId).filter((t): t is string => !!t)
    )];
  }

  function saveEngineer() {
    if (!formData.name?.trim()) return;
    const engSkills = formData.skills ?? [];
    const themeIds = deriveThemeIds(engSkills);
    if (expandedId === 'new') {
      addEngineer({ id: genId(), name: formData.name!, weeklyCapacityHours: formData.weeklyCapacityHours ?? 40,
        isActive: true, themeIds, skills: engSkills });
    } else if (expandedId) {
      updateEngineer(expandedId, { ...formData, themeIds });
    }
    setExpandedId(null);
    setNewMode(false);
    setFormData(blankEng);
  }

  function startEdit(eng: Engineer) {
    setExpandedId(eng.id);
    setFormData({ ...eng });
  }

  const engineerForm = (
    <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={fieldLabel}>Name *</label>
          <input value={formData.name ?? ''} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} style={inlineInput} />
        </div>
        <div>
          <label style={fieldLabel}>Weekly Capacity (hrs)</label>
          <input type="number" value={formData.weeklyCapacityHours ?? 40}
            onChange={e => setFormData(f => ({ ...f, weeklyCapacityHours: parseInt(e.target.value) || 40 }))} style={inlineInput} />
        </div>
      </div>

      <EngineerSkillEditor formData={formData} setFormData={setFormData} />

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={saveEngineer} style={addBtn}>Save Engineer</button>
        <button onClick={() => { setExpandedId(null); setNewMode(false); }} style={cancelBtn}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={card}>
        {engineers.map(eng => (
          <div key={eng.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: expandedId === eng.id ? '12px' : '0' }}>
            <div style={{ ...rowStyle, paddingBottom: expandedId === eng.id ? '0' : '8px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '14px', color: eng.isActive ? '#d0d6e0' : '#62666d', fontWeight: 510 }}>{eng.name}</span>
                <span style={{ fontSize: '11px', color: '#62666d', marginLeft: '8px' }}>{eng.weeklyCapacityHours}h/wk · {eng.skills.length} skills</span>
              </div>
              <button onClick={() => startEdit(eng)} style={editBtn}>Edit</button>
              <button onClick={() => updateEngineer(eng.id, { isActive: !eng.isActive })} style={eng.isActive ? deactivateBtn : activateBtn}>
                {eng.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
            {expandedId === eng.id && engineerForm}
          </div>
        ))}
        {!newMode && (
          <button onClick={() => { setNewMode(true); setExpandedId('new'); setFormData(blankEng); }}
            style={{ ...addBtn, marginTop: '12px' }}>
            + Add Engineer
          </button>
        )}
        {newMode && expandedId === 'new' && engineerForm}
      </div>
    </div>
  );
}

function LevelsTab() {
  const { skillLevels, updateSkillLevel } = useStore();
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  return (
    <div style={{ maxWidth: '400px' }}>
      <div style={card}>
        {[...skillLevels].sort((a, b) => a.rank - b.rank).map(l => (
          <div key={l.id} style={rowStyle}>
            <span style={{ fontSize: '12px', color: '#62666d', width: '24px' }}>#{l.rank}</span>
            {editId === l.id ? (
              <>
                <input value={editLabel} onChange={e => setEditLabel(e.target.value)} style={{ ...inlineInput, flex: 1 }} />
                <button onClick={() => { updateSkillLevel(l.id, { label: editLabel }); setEditId(null); }} style={saveBtn}>Save</button>
                <button onClick={() => setEditId(null)} style={cancelBtn}>Cancel</button>
              </>
            ) : (
              <>
                <span style={{ fontSize: '14px', color: '#d0d6e0', flex: 1 }}>{l.label}</span>
                <button onClick={() => { setEditId(l.id); setEditLabel(l.label); }} style={editBtn}>Edit</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const h1: React.CSSProperties = { fontSize: '24px', fontWeight: 590, color: '#f7f8f8', letterSpacing: '-0.03em', margin: 0 };
const sub: React.CSSProperties = { fontSize: '13px', color: '#8a8f98', margin: '2px 0 0' };
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px' };
const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' };
const inlineInput: React.CSSProperties = { background: '#191a1b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#d0d6e0', fontSize: '13px', padding: '4px 8px', outline: 'none' };
const fieldLabel: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 510, color: '#62666d', marginBottom: '4px' };
const editBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', color: '#8a8f98', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' };
const saveBtn: React.CSSProperties = { background: 'rgba(94,106,210,0.15)', color: '#7170ff', border: '1px solid rgba(94,106,210,0.3)', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' };
const cancelBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', color: '#62666d', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' };
const addBtn: React.CSSProperties = { background: '#5e6ad2', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 510, cursor: 'pointer' };
const deactivateBtn: React.CSSProperties = { background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' };
const activateBtn: React.CSSProperties = { background: 'rgba(39,166,68,0.08)', color: '#4ade80', border: '1px solid rgba(39,166,68,0.15)', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' };
