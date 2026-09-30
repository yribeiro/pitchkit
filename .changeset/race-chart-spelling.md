---
"@pitchkit/react": minor
---

`<RaceChart>`'s `emphasize` prop is now `emphasise`, matching the project's
British spelling. It has not shipped in a release, so nothing downstream breaks.

Markers and end labels are also now painted above every series line rather than
per-series, so a second team's line can no longer run over the first team's goal
markers. Annotation children stay above both.

Each series' total is now printed at its own line end, inside the plot, rather
than in a right-hand gutter, so the lines use the full width of the chart. The
leader's label sits above its line and the others below theirs, so close totals
never overlap. Only the value is printed, since the legend already names the
series, and the text has a surface-coloured halo so it stays legible where it
crosses a line. The y-axis ceiling now leaves room above the highest total for
the leader's label, so a total just under a round number no longer pushes that
label onto the trailing team's.
