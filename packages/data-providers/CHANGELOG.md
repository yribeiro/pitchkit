# @pitchkit/data-providers

## 0.6.0

### Minor Changes

- 8b9084e: Impect open data, and an `impect` pitch type.

  `@pitchkit/data-providers/impect` loads Impect's open event data: all 306
  Bundesliga 2023/24 matches, with lineups, squads and players. `fetchMatches`,
  `fetchMatchEvents` and the other fetchers take Impect's ids; `shots`, `passes`,
  `byTeam` and `inPeriod` narrow the feed; `isGoal`, `isOwnGoal`, `hasPass` and
  the other predicates read it. `matchSeconds` gives a match clock, since Impect's
  second half starts at 10,000 seconds, and `score` counts goals and own goals,
  since the match list has none. Field names are Impect's own; the lifted
  `x`/`y`/`endX`/`endY` are the adjusted coordinates, where the acting team
  attacks towards `+x`.

  Impect's data is **not openly licensed**: their terms allow non-commercial
  analytical and research use only, and forbid redistributing it. The package
  ships none of it and fetches from Impect's own repository.

  `core` gains the `"impect"` pitch type: 105x68 metres from the centre spot,
  y up (mplsoccer's `impect`). It widens the public `PitchTypeId` union, which is
  additive for callers, though an exhaustive `switch` over it gains a case.

  The bundled skill documents the pitch type and the loader, and its per-provider
  recipes move to a new `references/data-providers.md`, keeping `SKILL.md` under
  its length guidance.

### Patch Changes

- ab7cd3c: The Wyscout and Impect parsers' schema errors now word an unexpected object the way StatsBomb's and SkillCorner's do: `an object with keys: a, b, c, d, ...`, with an ellipsis when there are more than four keys. The providers now share one internal copy of these checks.

## 0.5.0

### Minor Changes

- 5dcf720: Metrica Sports open data, and a `metrica` pitch type.

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
