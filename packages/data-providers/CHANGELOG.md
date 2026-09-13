# @pitchkit/data-providers

## 0.3.0

### Minor Changes

- 4af4ed4: Add `@pitchkit/data-providers/skillcorner`, a loader for
  [SkillCorner's open data](https://github.com/SkillCorner/opendata) — 20 A-League
  2024/25 matches of broadcast tracking, plus their derived dynamic events and
  phases of play.

  Same shape as the StatsBomb module: pure `parse*`, networked `fetch*`,
  narrowing selectors (`playerPossessions`, `passingOptions`, `offBallRuns`,
  `onBallEngagements`) and composable predicates. SkillCorner's own field names
  and values are kept throughout; the only additions are corner-origin
  `pitchX`/`pitchY` coordinates.

  Tracking files are around 90 MB a match, so `streamTracking` is an async
  generator that aborts the download when the caller stops consuming, and
  `fetchTrackingWindow` reads a window with an HTTP `Range` request.
  `fetchTracking` reads the whole file for server-side use.

  Two things about the dataset that the types and docs make explicit rather than
  smoothing over: tracking coordinates are absolute and swap ends at half time
  while dynamic-event `x` is normalised to the attacking direction, and pitch
  dimensions vary per match (104–106 m), so coordinates are translated using each
  match's own declared dimensions.

  Adds `csv-parse` as a runtime dependency — two of the three SkillCorner files
  are CSV. It has no dependencies of its own.

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
