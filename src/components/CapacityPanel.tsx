import { DemandRow, Engineer, SkillLevel, Assignment, Skill, Theme } from '../types';
import { getSkillAvailableHours } from '../utils/capacity';
import { formatWeekLabel } from '../utils/dates';

interface CapacitySkill {
  skillId: string;
  requiredSkillLevelId: string | null;
}

interface Props {
  skills: CapacitySkill[];
  weeks: string[];
  demandRows: DemandRow[];
  engineers: Engineer[];
  skillLevels: SkillLevel[];
  assignments: Assignment[];
  allSkills: Skill[];
  allThemes: Theme[];
}

function getStatus(demand: number, available: number): 'ok' | 'partial' | 'none' | 'empty' {
  if (demand === 0) return 'empty';
  if (available >= demand) return 'ok';
  if (available > 0) return 'partial';
  return 'none';
}

const STATUS_COLOR = {
  ok: '#27a644',
  partial: '#f59e0b',
  none: '#ef4444',
  empty: '#3e3e44',
};

export default function CapacityPanel({ skills, weeks, demandRows, engineers, skillLevels, assignments, allSkills, allThemes }: Props) {
  if (skills.length === 0 || weeks.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 590, color: '#f7f8f8', marginBottom: '12px' }}>
        Capacity Overview
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', fontSize: '11px', color: '#62666d', fontWeight: 510,
                padding: '4px 8px', minWidth: '160px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                Skill
              </th>
              {weeks.map(w => (
                <th key={w} style={{ fontSize: '11px', color: '#62666d', fontWeight: 510,
                  padding: '4px 8px', textAlign: 'center', minWidth: '64px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>
                  {formatWeekLabel(w)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {skills.map(sk => {
              const skill = allSkills.find(s => s.id === sk.skillId);
              const theme = allThemes.find(t => t.id === skill?.themeId);
              const demandRow = demandRows.find(r => r.skillId === sk.skillId);

              return (
                <tr key={sk.skillId}>
                  <td style={{ padding: '6px 8px', fontSize: '13px', color: '#d0d6e0',
                    borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ fontWeight: 510 }}>{skill?.name ?? sk.skillId}</div>
                    <div style={{ fontSize: '11px', color: '#62666d' }}>{theme?.name}</div>
                  </td>
                  {weeks.map(w => {
                    const demand = demandRow?.weeklyHours.find(wh => wh.weekCommencing === w)?.hours ?? 0;
                    const available = getSkillAvailableHours(sk.skillId, sk.requiredSkillLevelId, w, engineers, skillLevels, assignments);
                    const status = getStatus(demand, available);
                    const color = STATUS_COLOR[status];

                    return (
                      <td key={w} style={{ padding: '6px 4px', textAlign: 'center',
                        borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} />
                          {demand > 0 && (
                            <div style={{ fontSize: '10px', color: '#62666d', lineHeight: 1 }}>
                              {demand}/{available}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: '16px', marginTop: '10px', paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {([['ok', 'Covered'], ['partial', 'Partial'], ['none', 'Insufficient']] as const).map(([s, label]) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: STATUS_COLOR[s] }} />
              <span style={{ fontSize: '11px', color: '#62666d' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
