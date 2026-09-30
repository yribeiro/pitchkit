---
"@pitchkit/react": minor
---

Add `<RaceChart>` and `useRaceChart()` — a cumulative step chart over match minutes, the
chart usually called an xG race chart or xG timeline.

It is a sibling of `<Pitch>`, not a layer inside one: there is no pitch and no provider
coordinate system, so it owns its own scales and takes no `type` prop. It renders SVG
only, so it server-renders like every mark layer, and it is responsive by default like
`<Pitch>`. Crosshair hover works with a mouse and by touch.

Each series' total is printed at its own line end, inside the plot, so the lines use the
full width. The leader's label sits above its line and the others below theirs, so close
totals never overlap, and the y-axis ceiling leaves room above the highest total for it.

`useRaceChart()` exposes `scaleX`, `scaleY` and `valueAt(seriesId, time)` so that events
which do not accumulate a value — bookings, substitutions — can be drawn as children
anchored to a series' line.

The bundled Agent Skill documents the component, including the two data traps it is easy
to hit with StatsBomb open data: penalty shootouts are period 5 and carry xG, and halves
do not end on minute 45.
