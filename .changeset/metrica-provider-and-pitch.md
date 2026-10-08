---
"@pitchkit/data-providers": minor
"@pitchkit/core": minor
"@pitchkit/react": minor
---

Metrica Sports open data, and a `metrica` pitch type.

`@pitchkit/data-providers/metrica` loads Metrica's two anonymised CSV sample
games: 25 fps tracking for every player and the ball, and the events that go
with it on the same clock. `fetchEvents(game)` reads the events;
`fetchTrackingWindow(game, { fromFrame, toFrame })` reads a window of frames
with HTTP `Range` requests, so a goal's build-up costs a few hundred KB instead
of 65 MB; `streamTracking(game)` is an async generator over both teams' files.
Field names are Metrica's own CSV headers (`event["Start Frame"]`); `x`/`y`,
`ball` and `players` are the only additions. Selectors (`shots`, `byTeam`,
`findPlayer`, `attackingDirection`, …) and predicates (`isGoal`, `isOwnGoal`,
`hasSubtype`, `wonChallenge`, …) read the rest. Sample Game 3, in FIFA EPTS
format, isn't supported.

`core` gains the `"metrica"` pitch type, a normalized `0..1` grid with its
origin top-left and y downward (mplsoccer's `metricasports`). It widens the
public `PitchTypeId` union: additive for callers, but an exhaustive `switch`
over it gains a case. It also adds `pitchGoalBoxDepth(dimensions)`.

It fixes how markings are drawn on every normalized grid. Radii are metres, so
the penalty-arc and corner-arc endpoints and the goal-box depth now convert
through `displayUnitScale` before meeting grid coordinates. On Opta and Wyscout
the penalty arcs now end on their own circle and the corner arcs are true
quarter circles; both shifted by a few pixels. StatsBomb, UEFA and SkillCorner
are byte-identical.

The bundled skill documents the `metrica` pitch type and the Metrica loader.
