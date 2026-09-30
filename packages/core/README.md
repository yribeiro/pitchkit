# @pitchkit/core

[![npm](https://img.shields.io/npm/v/@pitchkit/core)](https://www.npmjs.com/package/@pitchkit/core)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/yribeiro/pitchkit/blob/main/LICENSE)

The zero-dependency, framework-agnostic engine behind PitchKit: pitch dimensions, coordinate
transforms, the scene/layer model, geometry algorithms, and heatmap binning.

**Docs: [pitchkitjs.com](https://www.pitchkitjs.com)**

> **Most people want [`@pitchkit/react`](https://www.npmjs.com/package/@pitchkit/react)
> instead.** That's the supported rendering surface. This package is the maths underneath it —
> useful directly if you're computing pitch geometry outside React, or building bindings for
> another framework.

> **Early days — pre-`1.0`.** The API isn't stable yet.

## Install

```bash
npm install @pitchkit/core
```

Zero runtime dependencies. ESM, tree-shakeable, ships its own types.

## What's inside

**Pitch dimensions** — `statsbomb`, `opta`, `uefa`, each in the provider's real coordinate
space, sourced from mplsoccer's published constants so real event data aligns exactly.

```ts
import { getPitchDimensions, cropForHalf } from "@pitchkit/core";

const dimensions = getPitchDimensions("statsbomb"); // 120 × 80, markings included
const half = cropForHalf(dimensions); // crop window for the attacking half
```

**Coordinate transforms** — map provider coordinates to pixels, with orientation, padding and
cropping handled for you.

```ts
import { createPixelTransform } from "@pitchkit/core";

const transform = createPixelTransform({ dimensions, viewport, orientation: "vertical" });
```

`createStandardizeTransform()` converts between providers' coordinate spaces.

**Geometry** — `computeConvexHull`, `computeVoronoiCells`, `computeGoalAngle`,
`computeFlowBins`, `computePolygonCentroid`, plus arc/arrow/comet path maths.

**Density** — `computeHeatmapBins` (uniform grid), `computePositionalBins` (Juego de Posición
zones), `computeHexBins` (hexagonal lattice) and `computeKdeGrid` (Gaussian KDE) for binning
(count or weighted), `createColorScale` for a dependency-free colour ramp, and
`renderDensityLayersToCanvas` for painting to a `devicePixelRatio`-aware canvas.

**Theming** — `pitchTokens` (CSS variable names, for autocomplete) and `partStyle`.

## Note on the SVG renderer

`svgRenderer` / `renderSceneToSVGElement` are exported but **internal** — they exist to support
this repo's own dev harness, not as a supported vanilla-JS consumption path, and new mark types
are not added to them. Use `@pitchkit/react` to render. (Canvas heatmap rendering is
unaffected — `@pitchkit/react`'s `<Heatmap>` calls straight into it.)

## Links

- [Documentation & gallery](https://www.pitchkitjs.com)
- [Repository](https://github.com/yribeiro/pitchkit)
- [Issues](https://github.com/yribeiro/pitchkit/issues)
- [X](https://x.com/pitchkitjs) · [Instagram](https://www.instagram.com/pitchkitjs)
- [`@pitchkit/react`](https://www.npmjs.com/package/@pitchkit/react) — the React bindings

## Licence

MIT © Yohahn Ribeiro
