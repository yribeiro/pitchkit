# PitchKit API reference

Everything `@pitchkit/react` and `@pitchkit/core` export, at the version of
`@pitchkit/react` this file shipped inside. `dist/index.d.ts` in the installed package is
the authoritative source if the two ever disagree.

Throughout: **`Accessor<T, V>`** means `V | ((datum: T, index: number) => V)` — pass a
constant or a function of the datum. Props marked _(accessor)_ take either form; props
without the marker are plain static values.

---

## Roots

### `<Pitch>`

| Prop          | Type                                               | Default        | Notes                                                                                                                              |
| ------------- | -------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `type`        | `"statsbomb" \| "opta" \| "uefa" \| "skillcorner" \| "wyscout"` | —              | Required. The provider coordinate system.                                                                                          |
| `dimensions`  | `{ length?, width? }`                              | —              | Real extent of this pitch, for real-unit providers (SkillCorner is 104-106 m). Markings do not scale. Throws for normalized grids. |
| `orientation` | `"horizontal" \| "vertical"`                       | `"horizontal"` | Display concern only; never changes the data's units.                                                                              |
| `width`       | `number`                                           | —              | Fixed pixel width. Pass with `height` or not at all.                                                                               |
| `height`      | `number`                                           | —              | Fixed pixel height.                                                                                                                |
| `crop`        | `{ x0, y0, x1, y1 }`                               | —              | Window in provider units. Drives the container's aspect ratio.                                                                     |
| `padding`     | `{ top, right, bottom, left }`                     | zero           | Pixel padding inside the viewport.                                                                                                 |
| `appearance`  | `PitchAppearance`                                  | —              | `{ stripes?, goalType?, linesOnTop? }` — see below.                                                                                |
| `className`   | `string`                                           | —              | On the wrapper `<div>`, not the `<svg>`.                                                                                           |
| `style`       | `CSSProperties`                                    | —              | Merged into the wrapper's own positioning styles.                                                                                  |
| `children`    | `ReactNode`                                        | —              | Layer components.                                                                                                                  |

`PitchAppearance`:

| Field        | Type                | Default  | Meaning                                                                                  |
| ------------ | ------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `stripes`    | `boolean \| number` | `false`  | Mow stripes; a number sets the count, `true` picks a default.                            |
| `goalType`   | `"line" \| "box"`   | `"line"` | How goals are drawn.                                                                     |
| `linesOnTop` | `boolean`           | `false`  | Paint markings above the layers (mplsoccer's `line_zorder`). Turn on for density layers. |

Omitting `width`/`height` makes the pitch fill its container via `ResizeObserver`. Before
the first measurement (server render included) it renders at a nominal size with the
correct aspect ratio, so SSR output is never distorted.

### `<VerticalPitch>`

`Omit<PitchProps, "orientation">`. Identical to `<Pitch orientation="vertical">`; named to
match mplsoccer.

### `usePitch()`

Returns `{ dimensions, viewport, transform }` from the enclosing `<Pitch>`. Throws if
called outside one.

- `dimensions: PitchDimensions` — `{ pitchType, length, width, origin, yDirection, normalized, realLengthMeters, realWidthMeters, markings }`
- `viewport: Viewport` — `{ width, height, orientation, crop?, padding? }` in pixels
- `transform: PixelTransform` — `toPixel([x, y])`, `toProvider([px, py])`, `scale`

`toProvider` is the inverse needed to turn a pointer position back into pitch
coordinates.

---

## SVG layers

Every one of these accepts `className?: string` and `tooltip`, and must be a descendant of
`<Pitch>`. `tooltip` is `(d: T, i: number) => ReactNode` unless noted. Layer order in JSX
is paint order.

### `<Scatter>` — one `<circle>` per datum

| Prop          | Type                  | Default                                |
| ------------- | --------------------- | -------------------------------------- |
| `data`        | `readonly T[]`        | —                                      |
| `x`, `y`      | _(accessor)_ `number` | —                                      |
| `r`           | _(accessor)_ `number` | `4`                                    |
| `fill`        | _(accessor)_ `string` | `var(--pitch-marker-primary, #3b82f6)` |
| `fillOpacity` | _(accessor)_ `number` | —                                      |
| `stroke`      | _(accessor)_ `string` | `"none"`                               |
| `strokeWidth` | _(accessor)_ `number` | —                                      |

### `<Annotate>` — one `<text>` per datum

| Prop                 | Type                  | Default |
| -------------------- | --------------------- | ------- |
| `data`               | `readonly T[]`        | —       |
| `x`, `y`             | _(accessor)_ `number` | —       |
| `label`              | _(accessor)_ `string` | —       |
| `offsetX`, `offsetY` | _(accessor)_ `number` | `0`     |

Offsets are in pixels, applied after the coordinate transform. Text is 10px,
middle-anchored, filled with `var(--pitch-lines, …)`.

### `<Arrows>` — one `<line>` + arrowhead `<polygon>` per datum

| Prop            | Type                  | Default                                |
| --------------- | --------------------- | -------------------------------------- |
| `data`          | `readonly T[]`        | —                                      |
| `x`, `y`        | _(accessor)_ `number` | — start point                          |
| `x2`, `y2`      | _(accessor)_ `number` | — end point                            |
| `stroke`        | _(accessor)_ `string` | `var(--pitch-marker-primary, #3b82f6)` |
| `strokeWidth`   | _(accessor)_ `number` | `1.5`                                  |
| `strokeOpacity` | _(accessor)_ `number` | —                                      |
| `headSize`      | _(accessor)_ `number` | `6`                                    |

`headSize={0}` gives a plain line — the usual choice for pass-network edges.

### `<Comet>` — one tapered `<polygon>` per datum

| Prop                 | Type                  | Default                                        |
| -------------------- | --------------------- | ---------------------------------------------- |
| `data`               | `readonly T[]`        | —                                              |
| `x`, `y`, `x2`, `y2` | _(accessor)_ `number` | —                                              |
| `color`              | _(accessor)_ `string` | `var(--pitch-marker-primary, #3b82f6)`         |
| `startWidth`         | _(accessor)_ `number` | `0.5`                                          |
| `endWidth`           | _(accessor)_ `number` | `4`                                            |
| `gradient`           | `boolean`             | `false` — fades opacity 0 → 1 along the length |

SVG cannot vary a line's stroke width along its length, so this is a filled quad.

### `<Polygon>` — one `<polygon>` per datum, from explicit vertices

| Prop                         | Type                                                    | Default |
| ---------------------------- | ------------------------------------------------------- | ------- |
| `data`                       | `readonly T[]`                                          | —       |
| `points`                     | _(accessor)_ `ReadonlyArray<readonly [number, number]>` | —       |
| `fill`, `stroke`             | _(accessor)_ `string`                                   | —       |
| `fillOpacity`, `strokeWidth` | _(accessor)_ `number`                                   | —       |

### `<ConvexHull>` — one polygon for the whole dataset

| Prop                         | Type                  | Notes                                          |
| ---------------------------- | --------------------- | ---------------------------------------------- |
| `data`                       | `readonly T[]`        | —                                              |
| `x`, `y`                     | _(accessor)_ `number` | —                                              |
| `fill`, `stroke`             | `string`              | **Static, not accessors** — there is one shape |
| `fillOpacity`, `strokeWidth` | `number`              | Static                                         |
| `tooltip`                    | `ReactNode`           | **Static**, not a function                     |

### `<Voronoi>` — one cell per datum, clipped to the pitch

| Prop                         | Type                  |
| ---------------------------- | --------------------- |
| `data`                       | `readonly T[]`        |
| `x`, `y`                     | _(accessor)_ `number` |
| `fill`, `stroke`             | _(accessor)_ `string` |
| `fillOpacity`, `strokeWidth` | _(accessor)_ `number` |

### `<GoalAngle>` — a wedge from each point to both goalposts

| Prop                         | Type                                          | Default     |
| ---------------------------- | --------------------------------------------- | ----------- |
| `data`                       | `readonly T[]`                                | —           |
| `x`, `y`                     | _(accessor)_ `number`                         | —           |
| `goal`                       | _(accessor)_ `"left" \| "right" \| "nearest"` | `"nearest"` |
| `fill`, `stroke`             | _(accessor)_ `string`                         | —           |
| `fillOpacity`, `strokeWidth` | _(accessor)_ `number`                         | —           |

### `<Flow>` — one aggregate arrow per occupied grid bin

| Prop                               | Type                                     | Default                                    |
| ---------------------------------- | ---------------------------------------- | ------------------------------------------ |
| `data`                             | `readonly T[]`                           | —                                          |
| `x`, `y`                           | _(accessor)_ `number`                    | — start point, which decides the bin       |
| `x2`, `y2`                         | _(accessor)_ `number`                    | — end point                                |
| `binsX`, `binsY`                   | `number`                                 | — grid resolution                          |
| `colorMin`, `colorMax`             | `string`                                 | — colour at the lowest / highest bin count |
| `strokeWidthMin`, `strokeWidthMax` | `number`                                 | — width at the lowest / highest bin count  |
| `tooltip`                          | `(bin: FlowBin, i: number) => ReactNode` | — **per bin, not per datum**               |

`FlowBin` is `{ x, y, x2, y2, count }` in provider coordinates.

---

## Canvas density layers

Client-only: they paint to a `<canvas>` inside a `<foreignObject>` after hydration, and
render empty on the server. They take `className` and `style` but **no `tooltip`**, and
they need a `<Pitch>` with explicit `width` and `height` — see the responsive-canvas recipe
in SKILL.md. Pair them with `appearance={{ linesOnTop: true }}` so the markings stay
visible.

All four take `data`, `x`, `y`, an optional `weight` _(accessor)_ `number` (omitted =
count points per bin; provided = sum this per bin), and `colorMin` / `colorMax`.

| Component             | Extra props                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| `<Heatmap>`           | `binsX`, `binsY`                                                                                     |
| `<PositionalHeatmap>` | `layout?: "full" \| "horizontal" \| "vertical"` (default `"full"`), `stroke?`, `strokeWidth?`        |
| `<Hexbin>`            | `binsX` (hex columns; cell size follows), `stroke?`, `strokeWidth?`                                  |
| `<KDE>`               | `resolution?` (grid cells per axis), `bandwidth?` (provider units; default Silverman), `maxOpacity?` |

`<PositionalHeatmap>` bins into Juego de Posición zones derived from the pitch markings
rather than a uniform grid — mplsoccer's `bin_statistic_positional`. Unlike the binned
layers, `<KDE>` fades to transparent at low density instead of filling with `colorMin`.

---

## `@pitchkit/core` exports worth calling directly

**Dimensions**

- `getPitchDimensions(type, overrides?)` → `PitchDimensions`; `PITCH_DIMENSIONS` is the record
  of all five. `overrides` is `{ length?, width? }`, for real-unit providers whose pitches vary
  by stadium (SkillCorner's are 104–106 m). Markings never scale with it; overriding a
  normalized grid throws.
- `PitchDimensions.markings` → `{ penaltyAreaLength, penaltyAreaWidth, sixYardLength, sixYardWidth, centerCircleRadius, penaltySpotDistance, cornerArcRadius, goalWidth }`, in provider units.

**Transforms**

- `cropForHalf(dimensions)` → the attacking-half `CropWindow`.
- `createStandardizeTransform(from, to)` → `(point) => point`, mplsoccer's `Standardizer`.
- `createPixelTransform(dimensions, viewport)` → `PixelTransform`. `<Pitch>` builds this
  itself; call it directly only outside React.

**Aggregation** (the maths behind the density and geometry layers, usable standalone —
e.g. to compute a legend's domain, or to render a table alongside the chart)

- `computeHeatmapBins`, `computePositionalZones` / `computePositionalBins`,
  `computeHexBins` / `hexCorners`, `computeKdeGrid` / `silvermanBandwidth`
- `computeFlowBins`, `computeConvexHull`, `computeVoronoiCells`, `computePolygonCentroid`,
  `computeGoalAngle` / `selectGoal`
- `createColorScale` — the interpolator the density painters use

**Theming**

- `pitchTokens` — `{ surface, stripe, lines, lineWidth, markerPrimary, markerGoal, markerMiss }`,
  mapping to the CSS variable names. Values live in CSS, never here.

**Types** — `PitchTypeId`, `PitchDimensions`, `PitchMarkings`, `Point`, `Orientation`,
`CropWindow`, `ViewportPadding`, `Viewport`, `PixelTransform`, `Scene`, `Layer`,
`Accessor`, `PitchAppearance`, and one `*Layer<T>` interface per mark. The React
components' props are `Omit<XLayer<T>, "type">` plus `tooltip`, so the layer interfaces are
the canonical prop definitions.

### Not for consumer code

`svgRenderer`, `renderSceneToSVGElement`, `renderDensityLayersToCanvas`,
`renderHeatmapLayersToCanvas`, `canvasRenderer` and the `paint*` helpers are internal
rendering machinery, exported only for the repo's own dev harness. Render through
`@pitchkit/react`.
