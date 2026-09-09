---
"@pitchkit/core": minor
"@pitchkit/react": minor
---

Add the remaining density overlays: positional heatmap (Juego de Posición zones), hexbin, and KDE.

- `@pitchkit/core`: `computePositionalZones` / `computePositionalBins`, `computeHexBins` / `hexCorners`, `computeKdeGrid` / `silvermanBandwidth`, plus Canvas painters for each. `createColorScale` moved from `heatmap/colormap.ts` to `color/scale.ts` now that four layers share it (no change to the public export).
- `@pitchkit/react`: `<PositionalHeatmap>`, `<Hexbin>` and `<KDE>`.
- `renderHeatmapLayersToCanvas` is now an alias for `renderDensityLayersToCanvas`, which paints all four density layer types. The old name still works.
