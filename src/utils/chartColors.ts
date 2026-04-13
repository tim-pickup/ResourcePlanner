/** Consistent line colours used across Dashboard and ResourceLoad charts. */
export const CHART_LINE_COLORS = {
  capacity: '#5e6ad2',   // indigo  — total capacity ceiling (dashed)
  bau:      '#f59e0b',   // amber   — BAU support baseline (dashed)
  demand:   '#a78bfa',   // violet  — project demand
  committed: '#22c55e',  // green   — committed = BAU + locked project hours (stacked)
};

/** Per-theme line colours for the "By Theme" chart. */
export const THEME_LINE_COLORS: Record<string, { cap: string; demand: string; committed: string }> = {
  'theme-mom': { cap: '#5e6ad2', demand: '#a78bfa', committed: '#22c55e' },
  'theme-miv': { cap: '#38bdf8', demand: '#fb923c', committed: '#a3e635' },
};

export function getThemeLineColors(themeId: string) {
  return THEME_LINE_COLORS[themeId] ?? { cap: '#64748b', demand: '#f59e0b', committed: '#22c55e' };
}
