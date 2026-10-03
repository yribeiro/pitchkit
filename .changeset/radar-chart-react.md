---
"@pitchkit/react": minor
---

Add `<RadarChart>` and `useRadarChart()` — the football player radar.

Each metric is an axis with its own `min` and `max`, and `lowerIsBetter` flips an axis so outward
is always better. Pass one to three `series` and each draws a translucent shape; a single series
keeps mplsoccer's two-tone banding. The chart computes nothing: values, per-90s, percentiles and
ranges come from the caller. A value beyond its range is pinned to the edge, and the readout marks it off scale.

`labelRotation` (`"tangent"`, the default, `"radial"` or `"horizontal"`) sets how labels and ring
values sit round the rim, turning any that would read upside down.

Pass `renderDetail` and each axis label becomes a button: activating it replaces the chart with
your component, in the same box, under a header with a Back button. Escape and `close()` return
to the chart and restore focus; `selected` and `onSelectedChange` make it controllable.

A series `className` such as `text-rose-500` recolours every part of it, since each paints with
`currentColor`. Also exports the `RadarMetric`, `RadarSeries`, `RadarSelection`,
`RadarDetailContext` and `LabelRotation` types. The bundled Agent Skill documents the chart.
