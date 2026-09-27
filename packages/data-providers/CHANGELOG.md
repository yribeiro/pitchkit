# @pitchkit/data-providers

## 0.4.0

### Minor Changes

- f5002f2: Wyscout open data, and a `wyscout` pitch type.

  `@pitchkit/data-providers/wyscout` loads the Pappalardo et al. dataset — 1,941
  matches across the 2017/18 big-five leagues plus World Cup 2018 and Euro 2016,
  CC BY 4.0. `fetchMatch(id)` returns the events with both squads attached;
  `shots`/`passes`/`duels` narrow the feed, and Wyscout's numeric tags are read
  through `hasTag` and named predicates (`isGoal`, `isAccurate`, `wonDuel`, …).

  `core` gains the `"wyscout"` pitch type, widening the public `PitchTypeId`
  union — additive for callers, but an exhaustive `switch` over it gains a case.

  It also fixes a long-standing rendering bug: a normalized 0-100 grid now
  derives its shape from `realLengthMeters`/`realWidthMeters` rather than from
  `length`/`width`, so Opta and Wyscout render as 105:68 rectangles instead of
  squares. StatsBomb, UEFA and SkillCorner are unaffected — their unit scale is
  1 on both axes and their output is byte-identical.

## 0.3.1

### Patch Changes

- 4af1521: Reword the published `description` and broaden `keywords` so the packages are
  discoverable by what they are ("React football visualisation library",
  TypeScript, charting) rather than only by what they're like ("mplsoccer's
  feature set"). Metadata only — no code or API change.

  Also points every `pitchkitjs.com` link in the READMEs and the bundled Agent
  Skill (`SKILL.md`) at `https://www.pitchkitjs.com`, the host the site is
  actually served from — the apex 308-redirects there. A browser or a redirect-
  following crawler was never affected, but an agent fetching a link verbatim
  (the exact use case `SKILL.md` is written for) got a bodyless redirect
  instead of the page. Follow-up to [PR #69](https://github.com/yribeiro/pitchkit/pull/69),
  which fixed the docs site's own links but flagged the published packages as
  still outstanding.

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
