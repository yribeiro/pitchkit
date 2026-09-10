# @pitchkit/react

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
