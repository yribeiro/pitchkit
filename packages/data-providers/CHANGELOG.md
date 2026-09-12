# @pitchkit/data-providers

## 0.2.0

### Minor Changes

- 7808197: Add StatsBomb 360 tracking data support: `parseThreeSixty`,
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

## 0.1.0

### Minor Changes

- bea618c: Add `@pitchkit/data-providers`, a convenience loader for open football data,
  starting with StatsBomb.

  `@pitchkit/data-providers/statsbomb` takes you from a match id (or any URL) to
  chart-ready data in one call: `fetchMatchEvents(15946)` fetches and parses,
  `shots()` / `passes()` / `carries()` narrow the result, and predicates like
  `isGoal`, `isCorner` and `isComplete` compose on top with `.filter()`.

  Events keep StatsBomb's own field names and values — an outcome is `"Off T"`,
  not a re-spelled equivalent — so they read against StatsBomb's spec directly.
  The only additions are lifted coordinates (`x`, `y`, `endX`, `endY`, `endZ`)
  so events drop straight into a PitchKit accessor. Event types beyond shots,
  passes and carries come back intact as generic events rather than being
  dropped.

  Zero runtime dependencies, and no dependency on `@pitchkit/core` or
  `@pitchkit/react`.
