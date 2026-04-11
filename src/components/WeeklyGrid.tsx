import { useState } from 'react';
import { format, parseISO, getMonth } from 'date-fns';
import { formatWeekLabel } from '../utils/dates';

export interface GridRow {
  id: string;
  skillName: string;
  themeName: string;
  requiredLevelLabel?: string;
}

type ViewMode = 'week' | 'month' | 'quarter';

interface Props {
  weeks: string[];
  rows: GridRow[];
  weeklyHours: Record<string, Record<string, number>>;
  onChange?: (rowId: string, weekCommencing: string, hours: number) => void;
  readOnly?: boolean;
  showTotals?: boolean;
  compact?: boolean;
}

function getPeriodKey(weekStr: string, mode: 'month' | 'quarter'): string {
  const date = parseISO(weekStr);
  if (mode === 'month') return format(date, "MMM ''yy");
  const q = Math.ceil((getMonth(date) + 1) / 3);
  return `Q${q} '${format(date, 'yy')}`;
}

function buildAggregatedColumns(
  weeks: string[],
  mode: 'month' | 'quarter'
): { key: string; label: string; weeks: string[] }[] {
  const groups: Map<string, string[]> = new Map();
  weeks.forEach(w => {
    const key = getPeriodKey(w, mode);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(w);
  });
  return [...groups.entries()].map(([key, ws]) => ({ key, label: key, weeks: ws }));
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

const modeBtn = (active: boolean): React.CSSProperties => ({
  background: active ? 'rgba(94,106,210,0.2)' : 'rgba(255,255,255,0.04)',
  border: `1px solid ${active ? 'rgba(94,106,210,0.5)' : 'rgba(255,255,255,0.08)'}`,
  borderRadius: '4px',
  color: active ? '#7170ff' : '#8a8f98',
  fontSize: '11px',
  fontWeight: 510,
  padding: '3px 10px',
  cursor: 'pointer',
});

export default function WeeklyGrid({
  weeks, rows, weeklyHours, onChange,
  readOnly = false, showTotals = true, compact = false,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  if (rows.length === 0 || weeks.length === 0) {
    return <div style={{ color: '#62666d', fontSize: '13px', padding: '16px 0' }}>No skills selected.</div>;
  }

  const getHours = (rowId: string, week: string) => weeklyHours[rowId]?.[week] ?? 0;

  // Build display columns based on view mode
  const isAggregated = viewMode !== 'week';
  const aggCols = isAggregated ? buildAggregatedColumns(weeks, viewMode) : null;

  const getAggHours = (rowId: string, colWeeks: string[]) =>
    colWeeks.reduce((s, w) => s + getHours(rowId, w), 0);

  const rowTotal = (rowId: string) => weeks.reduce((s, w) => s + getHours(rowId, w), 0);

  const colTotal = (colWeeks: string[]) =>
    rows.reduce((s, r) => s + getAggHours(r.id, colWeeks), 0);

  const grandTotal = rows.reduce((s, r) => s + rowTotal(r.id), 0);

  const displayCols = isAggregated
    ? aggCols!
    : weeks.map(w => ({ key: w, label: formatWeekLabel(w), weeks: [w] }));

  return (
    <div>
      {/* Zoom controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', color: '#62666d' }}>View:</span>
        {(['week', 'month', 'quarter'] as ViewMode[]).map(m => (
          <button key={m} style={modeBtn(viewMode === m)} onClick={() => setViewMode(m)}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
        {isAggregated && (
          <span style={{ fontSize: '11px', color: '#62666d', marginLeft: '4px' }}>
            ({displayCols.length} {viewMode}s — read only in aggregated view)
          </span>
        )}
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%', tableLayout: 'auto' }}>
          <thead>
            <tr>
              <th style={{ ...headerCell, textAlign: 'left', minWidth: compact ? '140px' : '180px', position: 'sticky', left: 0, zIndex: 2 }}>
                Skill
              </th>
              {displayCols.map(col => (
                <th key={col.key} style={{ ...headerCell, minWidth: '72px' }}>
                  {col.label}
                </th>
              ))}
              {showTotals && <th style={{ ...headerCell, minWidth: '64px', color: '#8a8f98' }}>Total</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                <td style={{ ...cell, textAlign: 'left', background: '#0f1011', position: 'sticky', left: 0, zIndex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 510, color: '#d0d6e0' }}>{row.skillName}</div>
                  <div style={{ fontSize: '11px', color: '#62666d' }}>
                    {row.themeName}{row.requiredLevelLabel ? ` · min ${row.requiredLevelLabel}` : ''}
                  </div>
                </td>
                {displayCols.map(col => {
                  const val = getAggHours(row.id, col.weeks);
                  return (
                    <td key={col.key} style={{ ...cell, background: val > 0 ? 'rgba(94,106,210,0.06)' : 'transparent' }}>
                      {(readOnly || isAggregated) ? (
                        <span style={{ color: val > 0 ? '#d0d6e0' : '#3e3e44' }}>{val || '—'}</span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          max={999}
                          value={val === 0 ? '' : val}
                          placeholder="0"
                          onChange={e => onChange?.(row.id, col.key, Math.max(0, parseInt(e.target.value) || 0))}
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
                  {isAggregated ? `${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Total` : 'Weekly Total'}
                </td>
                {displayCols.map(col => (
                  <td key={col.key} style={{ ...cell, fontWeight: 590, color: '#8a8f98', background: 'rgba(255,255,255,0.02)' }}>
                    {colTotal(col.weeks) || '—'}
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
    </div>
  );
}
