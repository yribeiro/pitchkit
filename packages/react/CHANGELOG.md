# @pitchkit/react

## 0.5.0

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

### Patch Changes

- 6c710fe: Document the Wyscout data provider in the bundled Agent Skill.

  The `wyscout` pitch type landed in a prior release, but the skill's data-loading
  sections — the package-split table, the frontmatter description, and Recipe 5 —
  still only described StatsBomb and SkillCorner. Recipe 5 now includes a Wyscout
  example and its two load-bearing traps (a goal tagged twice; a shot with no end
  coordinate). `skill-doc.test.ts`'s import guard is extended to the
  `data-providers/wyscout` subpath, so a recipe importing something that
  subpath doesn't export fails the build the same way it already does for the
  other two providers.

- Updated dependencies [f5002f2]
  - @pitchkit/core@0.4.0

## 0.4.2

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

- Updated dependencies [4af1521]
  - @pitchkit/core@0.3.1

## 0.4.1

### Patch Changes

- Fix the bundled Agent Skill (`skills/pitchkit/`) contradicting itself: it listed
  `"skillcorner"` under "things that do not exist" while also documenting it in the
  pitch-type table two sections later, so an agent reading top-down would refuse a
  feature that shipped in `@pitchkit/core@0.3.0`. Also adds `@pitchkit/data-providers`
  to the skill — it was nearly invisible (no package-table row, absent from frontmatter),
  so an agent asked to plot real match data had no idea `fetchMatchEvents` existed.
  `skill-doc.test.ts` gained guards against both classes of drift recurring.

## 0.4.0

### Minor Changes

- 656077f: Add a `"skillcorner"` pitch type, and with it support for **center-origin
  coordinate systems** generally.

  SkillCorner measures in metres from the centre spot — x from `-52.5` to
  `+52.5` — which `PitchOrigin` has always allowed as a value but no code
  honoured. Data from `@pitchkit/data-providers/skillcorner` now plots with its
  raw `x`/`y`:

  ```tsx
  <Pitch type="skillcorner">
    <Scatter data={frame.player_data} x={(p) => p.x} y={(p) => p.y} />
  </Pitch>
  ```

  `getPitchDimensions` and `<Pitch>` also take an optional `{ length, width }`
  override, because SkillCorner pitches are real stadium pitches and the open
  data spans 104 to 106 m. Markings do not scale with it — a penalty area is
  16.5 m deep on any pitch — so only the outline, halfway line and goal lines
  move. Overriding a normalized grid (Opta's 0-100) throws rather than silently
  rescaling.

  Internally this adds `toExtentFrame`/`fromExtentFrame`, which map a provider's
  coordinates onto `0..length` by `0..width` and back. They are identity
  functions for every corner-origin provider, so **statsbomb, opta and uefa are
  unchanged** — but they were needed in more places than the transform: pitch
  geometry, the default crop, `cropForHalf`, and the four density modules, whose
  bounds checks would otherwise have silently discarded every point in a
  center-origin pitch's defending half.

  Adding a member to `PitchTypeId` widens a public union — additive for callers,
  but an exhaustive `switch` over it gains a case.

### Patch Changes

- Updated dependencies [656077f]
  - @pitchkit/core@0.3.0

## 0.3.1

### Patch Changes

- 52cf1d1: Fix an empty tooltip box appearing when a `tooltip` accessor returns nothing
  for a datum. Layer components set tooltip state on hover whenever the prop is
  present, without inspecting the returned value, so a per-datum accessor like
  `(p) => p.isKeeper ? "Goalkeeper" : undefined` painted a small blank tooltip
  over every unlabelled mark. `<Pitch>` now skips the overlay when the content
  is `null`, `undefined`, `false`, or `""`. Affects every mark that takes a
  `tooltip` prop — Scatter, Annotate, Arrows, Comet, Flow, Polygon, ConvexHull,
  Voronoi and GoalAngle.

## 0.3.0

### Minor Changes

- 5706440: Ship an Agent Skill inside the published package, so coding agents get PitchKit's real API
  instead of inventing an mplsoccer-flavoured one.

  - `skills/pitchkit/SKILL.md` — the mental model (package split, provider coordinate
    systems, accessors, responsive-by-default, CSS-variable theming), the gotchas that break
    builds (the `"use client"` boundary, density layers needing a fixed-pixel pitch), and
    four complete worked recipes: shot map, pass map, heatmap, pass network.
  - `skills/pitchkit/references/api.md` — full prop tables for every component plus the
    `@pitchkit/core` exports worth calling directly.
  - A new `pitchkit` bin: `npx @pitchkit/react skills install [--dir <path>] [--force]`
    symlinks the skill into a consuming project (default `.claude/skills/`), falling back to
    a copy where the filesystem won't take a link. `npx @pitchkit/react skills path` prints
    its location in `node_modules`.

  Because the skill travels in the tarball, and the installed link points into
  `node_modules`, `npm update @pitchkit/react` moves the skill with it — so an agent reads
  the API of the version actually installed, which `llms.txt`-style docs can't guarantee.
  The `skills/<name>/SKILL.md` layout is the shared convention, so generic installers pick
  it up without this CLI.

## 0.2.0

### Minor Changes

- e03d464: Add the remaining density overlays: positional heatmap (Juego de Posición zones), hexbin, and KDE.

  - `@pitchkit/core`: `computePositionalZones` / `computePositionalBins`, `computeHexBins` / `hexCorners`, `computeKdeGrid` / `silvermanBandwidth`, plus Canvas painters for each. `createColorScale` moved from `heatmap/colormap.ts` to `color/scale.ts` now that four layers share it (no change to the public export).
  - `@pitchkit/react`: `<PositionalHeatmap>`, `<Hexbin>` and `<KDE>`.
  - `renderHeatmapLayersToCanvas` is now an alias for `renderDensityLayersToCanvas`, which paints all four density layer types. The old name still works.

- e03d464: Add `appearance.linesOnTop` to `<Pitch>` — mplsoccer's `line_zorder`.

  Paints the pitch markings above the layer children instead of below them, so an opaque density
  fill (`<Heatmap>`, `<PositionalHeatmap>`, `<Hexbin>`, `<KDE>`) no longer covers the markings it
  sits on. Off by default, so discrete SVG marks still paint over the lines. Only the markings move
  — the grass surface and stripes stay at the bottom either way.

### Patch Changes

- Updated dependencies [e03d464]
- Updated dependencies [e03d464]
  - @pitchkit/core@0.2.0

## 0.1.0

### Minor Changes

- Initial public release. `@pitchkit/core` ships the zero-dependency coordinate/transform
  pipeline, scene/layer model, SVG renderer, and Canvas heatmap renderer. `@pitchkit/react`
  ships the declarative bindings on top: `<Pitch>`/`<VerticalPitch>` (responsive by default),
  `<Scatter>`, `<Annotate>`, `<Arrows>`, `<Comet>`, `<Heatmap>`, the geometric overlay marks
  (Flow, Polygon, Convex Hull, Voronoi, Goal Angle), hover tooltips, `usePitch()`, CSS-variable
  theming, and Tailwind `className` support.

### Patch Changes

- Updated dependencies
  - @pitchkit/core@0.1.0
