# @pitchkit/core

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

## 0.1.0

### Minor Changes

- Initial public release. `@pitchkit/core` ships the zero-dependency coordinate/transform
  pipeline, scene/layer model, SVG renderer, and Canvas heatmap renderer. `@pitchkit/react`
  ships the declarative bindings on top: `<Pitch>`/`<VerticalPitch>` (responsive by default),
  `<Scatter>`, `<Annotate>`, `<Arrows>`, `<Comet>`, `<Heatmap>`, the geometric overlay marks
  (Flow, Polygon, Convex Hull, Voronoi, Goal Angle), hover tooltips, `usePitch()`, CSS-variable
  theming, and Tailwind `className` support.
