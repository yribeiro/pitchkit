/**
 * The chart tokens every non-pitch chart reads, with the fallback each one
 * renders when the variable is unset. One table, so a default changes in one
 * place (docs/decisions.md D8, D23).
 */

/**
 * Categorical defaults, in fixed slot order so colour follows the entity
 * and never its rank. Slot 1 is the same hex as `--pitch-marker-primary`,
 * so charts and pitches agree out of the box. The set is validated for
 * colourblind separation rather than picked by eye; past six, fold the
 * tail into an "Other" series rather than generating a seventh hue.
 */
export const SERIES_COLORS = [
  "var(--pitch-series-1, #3b82f6)",
  "var(--pitch-series-2, #eb6834)",
  "var(--pitch-series-3, #1baf7a)",
  "var(--pitch-series-4, #eda100)",
  "var(--pitch-series-5, #e87ba4)",
  "var(--pitch-series-6, #008300)",
] as const;

/** The series colour for slot `index`, wrapping past the sixth. */
export function seriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length] as string;
}

/** Whatever is behind the chart: rings and halos knock out to it. */
export const CHART_SURFACE = "var(--pitch-chart-surface, #ffffff)";
export const CHART_TEXT = "var(--pitch-chart-text, #12170f)";
export const CHART_MUTED = "var(--pitch-chart-muted, #7b8474)";
export const AXIS = "var(--pitch-axis, #c6cebc)";
export const GRID = "var(--pitch-grid, #e5eade)";
export const CARD_YELLOW = "var(--pitch-card-yellow, #facc15)";
export const CARD_RED = "var(--pitch-card-red, #ef4444)";
