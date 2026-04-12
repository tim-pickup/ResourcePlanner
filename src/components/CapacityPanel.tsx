import { DemandRow, Engineer, SkillLevel, Assignment, Skill, Theme } from '../types';
import { formatWeekLabel } from '../utils/dates';

interface Props {
  demandRows: DemandRow[];
  weeks: string[];
  engineers: Engineer[];
  skillLevels: SkillLevel[];
  assignments: Assignment[];
  projectId: string;
  allSkills: Skill[];
  allThemes: Theme[];
}

export default function CapacityPanel({
  demandRows, weeks, assignments, projectId, allSkills, allThemes,
}: Props) {
  if (demandRows.length === 0 || weeks.length === 0) return null;

  const projectAssignments = assignments.filter(a => a.projectId === projectId);

  function getDemand(rowId: string, week: string): number {
    const dr = demandRows.find(r => r.id === rowId);
    return dr?.weeklyHours.find(wh => wh.weekCommencing === week)?.hours ?? 0;
  }

  function getAssigned(rowId: string, week: string): number {
    return projectAssignments
      .filter(a => a.demandRowId === rowId)
      .reduce((sum, a) => {
        const wh = a.weeklyHours.find(w => w.weekCommencing === week);
        return sum + (wh?.hours ?? 0);
      }, 0);
  }

  function getStatus(demand: number, assigned: number): 'covered' | 'partial' | 'unassigned' | 'empty' {
    if (demand === 0) return 'empty';
    if (assigned >= demand) return 'covered';
    if (assigned > 0) return 'partial';
    return 'unassigned';
  }

  const STATUS_COLOR = {
    covered:    '#27a644',
    partial:    '#f59e0b',
    unassigned: '#ef4444',
    empty:      '#3e3e44',
  };

  const STATUS_LABEL = {
    covered:    'Fully Covered',
    partial:    'Partially Assigned',
    unassigned: 'No Assignment',
    empty:      'No Demand',
  };

  // Only show weeks that have at least some demand
  const activeWeeks = weeks.filter(w => demandRows.some(dr => getDemand(dr.id, w) > 0));
  const displayWeeks = activeWeeks.length > 0 ? activeWeeks : weeks;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
    }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: 590, color: '#f7f8f8' }}>Demand Coverage</div>
        <div style={{ fontSize: '11px', color: '#62666d', marginTop: '2px' }}>
          Each cell shows <strong style={{ color: '#8a8f98' }}>demand / assigned / gap</strong> hours.
          Green = fully covered, amber = partial, red = unassigned.
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={th}>Skill / Row</th>
              {displayWeeks.map(w => (
                <th key={w} style={{ ...th, minWidth: '72px', textAlign: 'center' }}>
                  {formatWeekLabel(w)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {demandRows.map(dr => {
              const skill = allSkills.find(s => s.id === dr.skillId);
              const theme = allThemes.find(t => t.id === skill?.themeId);
              const totalDemand = displayWeeks.reduce((s, w) => s + getDemand(dr.id, w), 0);
              const totalAssigned = displayWeeks.reduce((s, w) => s + getAssigned(dr.id, w), 0);
              const totalGap = Math.max(0, totalDemand - totalAssigned);

              return (
                <tr key={dr.id}>
                  <td style={{ ...td, minWidth: '160px' }}>
                    <div style={{ fontWeight: 510, color: '#d0d6e0', fontSize: '13px' }}>
                      {skill?.name || dr.skillId}
                    </div>
                    {dr.label && (
                      <div style={{ fontSize: '10px', color: '#8a8f98', fontStyle: 'italic' }}>{dr.label}</div>
                    )}
                    <div style={{ fontSize: '11px', color: '#62666d' }}>{theme?.name}</div>
                    <div style={{ fontSize: '10px', marginTop: '3px', color: totalGap > 0 ? '#f59e0b' : '#27a644' }}>
                      {totalDemand === 0 ? 'No demand' : totalGap > 0 ? `${totalGap}h gap remaining` : 'Fully covered'}
                    </div>
                  </td>
                  {displayWeeks.map(w => {
                    const demand = getDemand(dr.id, w);
                    const assigned = getAssigned(dr.id, w);
                    const gap = Math.max(0, demand - assigned);
                    const status = getStatus(demand, assigned);
                    const color = STATUS_COLOR[status];

                    return (
                      <td key={w} style={{ ...td, textAlign: 'center', padding: '6px 4px' }}>
                        {demand === 0 ? (
                          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: STATUS_COLOR.empty, margin: '0 auto' }} />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} title={STATUS_LABEL[status]} />
                            <div style={{ fontSize: '9px', color: '#8a8f98', lineHeight: 1.2 }}>
                              <span style={{ color: '#62666d' }}>{demand}h</span>
                              {' / '}
                              <span style={{ color: assigned > 0 ? '#d0d6e0' : '#62666d' }}>{assigned}h</span>
                            </div>
                            {gap > 0 && (
                              <div style={{ fontSize: '9px', color: '#f59e0b', lineHeight: 1 }}>-{gap}h</div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ display: 'flex', gap: '16px', marginTop: '10px', paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
          {([
            ['covered', 'Fully Covered — all demand hours assigned'],
            ['partial', 'Partial — some hours assigned, gap remains'],
            ['unassigned', 'Unassigned — no engineers assigned yet'],
          ] as const).map(([s, label]) => (
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

const th: React.CSSProperties = {
  textAlign: 'left', fontSize: '11px', color: '#62666d', fontWeight: 510,
  padding: '4px 8px', minWidth: '64px', borderBottom: '1px solid rgba(255,255,255,0.05)',
};
const td: React.CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid rgba(255,255,255,0.03)',
};
