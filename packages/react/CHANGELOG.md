# @pitchkit/react

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
