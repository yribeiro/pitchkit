/**
 * CSS custom property names the renderer reads for theming (docs/architecture.md#theming-and-styling).
 * This object exists purely for editor autocomplete and typo-safety when
 * consumers set these variables in their own CSS — the values themselves
 * always live in CSS, never here.
 */
export const pitchTokens = {
  surface: "--pitch-surface",
  stripe: "--pitch-stripe",
  lines: "--pitch-lines",
  lineWidth: "--pitch-line-width",
  markerPrimary: "--pitch-marker-primary",
  markerGoal: "--pitch-marker-goal",
  markerMiss: "--pitch-marker-miss",
  series1: "--pitch-series-1",
  series2: "--pitch-series-2",
  series3: "--pitch-series-3",
  series4: "--pitch-series-4",
  series5: "--pitch-series-5",
  series6: "--pitch-series-6",
  axis: "--pitch-axis",
  grid: "--pitch-grid",
  chartSurface: "--pitch-chart-surface",
  chartText: "--pitch-chart-text",
  chartMuted: "--pitch-chart-muted",
} as const;
