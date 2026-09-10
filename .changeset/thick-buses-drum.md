---
"@pitchkit/data-providers": minor
---

Add StatsBomb 360 tracking data support: `parseThreeSixty`,
`loadThreeSixty`/`fetchMatchThreeSixty`, and the joining/filtering helpers
`indexThreeSixtyByEvent`, `teammatesIn`, `opponentsIn`, `actorIn`, `keeperIn`,
`visibleAreaPolygon`, plus predicates `isTeammate`, `isOpponent`, `isActor`,
`isKeeper`.

Follows the same design as the events loader: tracked players keep
StatsBomb's own field names (`teammate`/`actor`/`keeper`/`location`, no
invented identity), with only `x`/`y` lifted from `location` for direct use
as a PitchKit accessor. `StatsBombMatch.match_status_360` is now typed, so
callers can check per-match 360 availability before fetching rather than
reacting to a 404.
