---
"@pitchkit/core": minor
---

Add the cartesian chart scaffold and cumulative race maths that `<RaceChart>` is built on:
`createLinearScale`, `niceTicks`, `matchMinuteTicks`, `computeChartFrame`,
`computeCumulativeSeries`, `valueAtTime`, `resolveEndTime`, `stepPath` and `stepAreaPath`.

These are the first modules in `core` that do not reason about a pitch. They have no
dependency on `dimensions/`, `transform/` or `scene/`, and are held at 100% coverage like
the transform pipeline.

Also adds the chart theme tokens to `pitchTokens`: `--pitch-series-1` through
`--pitch-series-6`, `--pitch-axis`, `--pitch-grid`, `--pitch-chart-surface`,
`--pitch-chart-text` and `--pitch-chart-muted`.
