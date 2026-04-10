import { formatWeekLabel } from '../utils/dates';

export interface GridRow {
  id: string;
  skillName: string;
  themeName: string;
  requiredLevelLabel?: string;
}

interface Props {
  weeks: string[];
  rows: GridRow[];
  weeklyHours: Record<string, Record<string, number>>;
  onChange?: (rowId: string, weekCommencing: string, hours: number) => void;
  readOnly?: boolean;
  showTotals?: boolean;
  compact?: boolean;
}

const cell: React.CSSProperties = {
  padding: '6px 8px',
  textAlign: 'center',
  fontSize: '12px',
  borderRight: '1px solid rgba(255,255,255,0.05)',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  whiteSpace: 'nowrap',
};

const headerCell: React.CSSProperties = {
  ...cell,
  color: '#62666d',
  fontWeight: 510,
  background: '#0f1011',
  position: 'sticky',
  top: 0,
};

export default function WeeklyGrid({ weeks, rows, weeklyHours, onChange, readOnly = false, showTotals = true, compact = false }: Props) {
  if (rows.length === 0 || weeks.length === 0) {
    return (
      <div style={{ color: '#62666d', fontSize: '13px', padding: '16px 0' }}>
        No skills selected.
      </div>
    );
  }

  const getHours = (rowId: string, week: string) => weeklyHours[rowId]?.[week] ?? 0;
  const rowTotal = (rowId: string) => weeks.reduce((s, w) => s + getHours(rowId, w), 0);
  const colTotal = (week: string) => rows.reduce((s, r) => s + getHours(r.id, week), 0);
  const grandTotal = rows.reduce((s, r) => s + rowTotal(r.id), 0);

  return (
    <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <table style={{ borderCollapse: 'collapse', minWidth: '100%', tableLayout: 'auto' }}>
        <thead>
          <tr>
            <th style={{ ...headerCell, textAlign: 'left', minWidth: compact ? '140px' : '180px', position: 'sticky', left: 0, zIndex: 2 }}>
              Skill
            </th>
            {weeks.map(w => (
              <th key={w} style={{ ...headerCell, minWidth: '72px' }}>
                {formatWeekLabel(w)}
              </th>
            ))}
            {showTotals && <th style={{ ...headerCell, minWidth: '64px', color: '#8a8f98' }}>Total</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td style={{
                ...cell, textAlign: 'left', background: '#0f1011',
                position: 'sticky', left: 0, zIndex: 1,
              }}>
                <div style={{ fontSize: '13px', fontWeight: 510, color: '#d0d6e0' }}>{row.skillName}</div>
                <div style={{ fontSize: '11px', color: '#62666d' }}>
                  {row.themeName}{row.requiredLevelLabel ? ` · min ${row.requiredLevelLabel}` : ''}
                </div>
              </td>
              {weeks.map(w => {
                const val = getHours(row.id, w);
                return (
                  <td key={w} style={{ ...cell, background: val > 0 ? 'rgba(94,106,210,0.06)' : 'transparent' }}>
                    {readOnly ? (
                      <span style={{ color: val > 0 ? '#d0d6e0' : '#3e3e44' }}>{val || '—'}</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={val === 0 ? '' : val}
                        placeholder="0"
                        onChange={e => onChange?.(row.id, w, Math.max(0, parseInt(e.target.value) || 0))}
                        style={{
                          width: '52px',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.1)',
                          color: '#d0d6e0',
                          fontSize: '12px',
                          textAlign: 'center',
                          padding: '2px 4px',
                          outline: 'none',
                        }}
                      />
                    )}
                  </td>
                );
              })}
              {showTotals && (
                <td style={{ ...cell, fontWeight: 590, color: '#f7f8f8', background: 'rgba(255,255,255,0.02)' }}>
                  {rowTotal(row.id)}h
                </td>
              )}
            </tr>
          ))}
          {showTotals && (
            <tr>
              <td style={{ ...cell, textAlign: 'left', background: '#0f1011', position: 'sticky', left: 0, zIndex: 1,
                fontSize: '11px', fontWeight: 590, color: '#8a8f98' }}>
                Weekly Total
              </td>
              {weeks.map(w => (
                <td key={w} style={{ ...cell, fontWeight: 590, color: '#8a8f98', background: 'rgba(255,255,255,0.02)' }}>
                  {colTotal(w) || '—'}
                </td>
              ))}
              <td style={{ ...cell, fontWeight: 590, color: '#f7f8f8', background: 'rgba(94,106,210,0.1)' }}>
                {grandTotal}h
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
