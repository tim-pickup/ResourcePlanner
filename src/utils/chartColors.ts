/** Consistent line colours used across Dashboard and ResourceLoad charts.
 *  BAU = orange, Capacity = dark blue, Committed = green, Demand = purple.
 */
export const CHART_LINE_COLORS = {
  capacity:  '#1d4ed8',  // dark blue  — total capacity ceiling (dashed)
  bau:       '#f59e0b',  // orange     — BAU support baseline (dashed)
  demand:    '#a78bfa',  // purple     — project demand
  committed: '#22c55e',  // green      — committed = BAU + locked project hours (stacked)
};

/** Per-theme charts reuse the same semantic colours so every chart is consistent. */
export const THEME_LINE_COLORS: Record<string, { cap: string; demand: string; committed: string }> = {
  'theme-mom': { cap: '#1d4ed8', demand: '#a78bfa', committed: '#22c55e' },
  'theme-miv': { cap: '#1d4ed8', demand: '#a78bfa', committed: '#22c55e' },
};

export function getThemeLineColors(themeId: string) {
  return THEME_LINE_COLORS[themeId] ?? { cap: '#1d4ed8', demand: '#a78bfa', committed: '#22c55e' };
}
