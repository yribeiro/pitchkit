---
"@pitchkit/react": patch
---

Fix an empty tooltip box appearing when a `tooltip` accessor returns nothing
for a datum. Layer components set tooltip state on hover whenever the prop is
present, without inspecting the returned value, so a per-datum accessor like
`(p) => p.isKeeper ? "Goalkeeper" : undefined` painted a small blank tooltip
over every unlabelled mark. `<Pitch>` now skips the overlay when the content
is `null`, `undefined`, `false`, or `""`. Affects every mark that takes a
`tooltip` prop — Scatter, Annotate, Arrows, Comet, Flow, Polygon, ConvexHull,
Voronoi and GoalAngle.
