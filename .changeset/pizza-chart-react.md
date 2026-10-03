---
"@pitchkit/react": minor
---

Add `<PizzaChart>` and `usePizzaChart()` — the football percentile pizza.

One slice per metric, as long as the value, around a hole, with dashed rings at each quarter. The
chart computes nothing: values and percentiles come from the caller (0–100 by default), and
`lowerIsBetter` flips a slice so a long one is always the good one. With one series the slices take
their `group`'s colour; with several they take their series' colour and the group shows as an arc
on the rim. Colour a group with `groups={{ Attacking: { className: "text-sky-500" } }}`.

`seriesLayout` chooses how several series share a slice: `"side-by-side"` (default, readable to
three) or `"overlay"` (two, largest drawn first so the smaller shows on top). Value boxes print for one
series and for an overlay, each series in its own lane so close values never overlap.

Pass `renderDetail` and each slice becomes a button: activating it replaces the chart with your
component, in the same box, under a Back button; the context names the metric and the series whose
slice was clicked. Escape and `close()` return, focus goes back to the slice, and `selected` and
`onSelectedChange` make it controllable. `labelRotation` works as on the radar.

The radar's selection and detail view are now shared with the pizza (`chart-detail.tsx`); the radar's
public API and its `radar-detail` / `radar-back` parts are unchanged. The bundled Agent Skill
documents the chart.
