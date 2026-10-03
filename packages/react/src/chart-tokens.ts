import { pitchTokens } from "@pitchkit/core";

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
const token = (name: string, fallback: string) => `var(${name}, ${fallback})`;

export const SERIES_COLORS = [
  token(pitchTokens.series1, "#3b82f6"),
  token(pitchTokens.series2, "#eb6834"),
  token(pitchTokens.series3, "#1baf7a"),
  token(pitchTokens.series4, "#eda100"),
  token(pitchTokens.series5, "#e87ba4"),
  token(pitchTokens.series6, "#008300"),
] as const;

/** The series colour for slot `index`, wrapping past the sixth. */
export function seriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length] as string;
}

/** Whatever is behind the chart: rings and halos knock out to it. */
export const CHART_SURFACE = token(pitchTokens.chartSurface, "#ffffff");
export const CHART_TEXT = token(pitchTokens.chartText, "#12170f");
export const CHART_MUTED = token(pitchTokens.chartMuted, "#7b8474");
/** Controls a chart draws itself, such as the radar's Back button. Green-700 on white text is 5:1. */
export const CHART_ACCENT = token(pitchTokens.chartAccent, "#15803d");
export const CHART_ACCENT_TEXT = token(pitchTokens.chartAccentText, "#ffffff");
export const AXIS = token(pitchTokens.axis, "#c6cebc");
export const GRID = token(pitchTokens.grid, "#e5eade");
export const CARD_YELLOW = token(pitchTokens.cardYellow, "#facc15");
export const CARD_RED = token(pitchTokens.cardRed, "#ef4444");
/** Shared by the pitch tooltip and the chart readout. */
export const TOOLTIP_BG = token(pitchTokens.tooltipBg, "rgba(17, 17, 17, 0.92)");
export const TOOLTIP_TEXT = token(pitchTokens.tooltipColor, "#fff");
