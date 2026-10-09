# Architecture

How PitchKit is built: rendering, coordinates, packages, styling, and the engineering
standards around them. The reasons behind these choices are in the
[decision log](./decisions.md).

- [Rendering: SVG and Canvas](#rendering-svg-and-canvas)
- [Coordinates and pitch types](#coordinates-and-pitch-types)
- [Scene and layers](#scene-and-layers)
- [Non-pitch charts](#non-pitch-charts)
- [Packages](#packages)
- [React and Next.js](#react-and-nextjs)
- [Responsive and multi-device](#responsive-and-multi-device)
- [Theming and styling](#theming-and-styling)
- [Accessibility](#accessibility)
- [Performance budgets](#performance-budgets)
- [Data loaders](#data-loaders)
- [Docs site](#docs-site)
- [Engineering standards](#engineering-standards)
- [Developer mental model](#developer-mental-model)
- [Implementation notes](#implementation-notes)
- [Data provider facts](#data-provider-facts)

---

## Rendering: SVG and Canvas

- **SVG** for pitch geometry and discrete marks (scatter, arrows, comets, annotations, hulls,
  Voronoi). It is crisp at any DPI, server-renderable, and DOM-addressable for hover,
  tooltips and accessibility.
- **Canvas 2D** for dense raster layers (heatmap, positional heatmap, hexbin, KDE), where one
  DOM node per bin would be too slow. WebGL remains an option for tracking-scale data later.
- A layer declares what to draw, and the renderer decides how. The public API is the same
  regardless of backend. ([D1](./decisions.md#d1-hybrid-rendering-svg-for-marks-canvas-for-density))

## Coordinates and pitch types

A `PitchDimensions` model encodes, per provider: extent, origin (corner or centre), y-axis
direction, orientation, and whether the grid is normalised. Users give data in provider
coordinates. One scale-and-transform pipeline (`transform/pixel-transform.ts`) maps it to
pixels for the current container size, orientation and crop, so every layer aligns and
resizes together.

Pitch types shipped: `statsbomb`, `opta`, `wyscout`, `uefa`, `skillcorner`. Two
non-obvious cases:

- Centre-origin grids convert through an extent frame
  ([D5](./decisions.md#d5-centre-origin-coordinates-are-handled-in-core-never-in-callers);
  see [centre-origin pitches](#centre-origin-pitches)).
- Normalised `0..100` grids derive their shape from real metres
  ([D6](./decisions.md#d6-normalised-grids-derive-their-shape-from-real-metres)).

## Scene and layers

```
Pitch (scene)
 ├─ dimensions (provider coordinate model)
 ├─ viewport  (size, orientation, crop, padding)
 └─ layers:   [ Scatter, Arrows, Comet, Heatmap, KDE, ConvexHull, … ]
```

Layers are pure data and options; they don't own DOM. That keeps the scene serialisable,
testable and renderer-independent.

## Non-pitch charts

Some football data has no location on a pitch: a quantity accumulating over match minutes, a
player's percentile profile. Those charts are roots in their own right, siblings of `<Pitch>` and
not layers inside it ([D23](./decisions.md#d23-non-pitch-charts-are-roots-with-their-own-scales)).
`<RaceChart>` is the first and `<MomentumChart>` the second.

```
RaceChart (root)
 ├─ series    (one per team or player; data stays on the root)
 ├─ panels    (one per period, contiguous, width proportional to its minutes; per-panel x scale)
 ├─ scaleY    (createLinearScale: accumulated value -> y, y-flip in the range)
 ├─ chrome    (axes, grid, period breaks, legend)
 ├─ lines, then marks and end labels, then children
 └─ crosshair (one hit area over the plot)
```

- **`core` owns the maths, with no pitch in it.** `chart/` (`createLinearScale`, `niceTicks`,
  `matchMinuteTicks`, `computeChartFrame`) and `race/` (`computeCumulativeSeries`, `valueAtTime`,
  `racePeriodRanges`, `stepPath`, `stepAreaPath`) take plain numbers. The React binding resolves
  accessors before calling in, so `race/` never imports `scene/`.
- **Every value reaches a pixel through a scale.** No component multiplies a minute or an xG by
  anything.
- **Every datum has a period, and a race is ordered by period, then minute.** Minutes restart at 45,
  so first-half stoppage time and the second half share minutes. Each period is its own panel,
  laid out by `layoutMomentumPanels` with no gap so the line runs straight on; a period runs from
  its nominal start to `max(nominal end, ceil(its last datum))` (`racePeriodRanges`), and `endTime`
  sets where the last one ends ([D28](./decisions.md#d28-time-based-charts-require-a-period)).
- **The step is step-after** (d3's `curveStepAfter`), the only correct interpolation for a running
  total: a slope would draw xG accruing in minutes when no shot was taken. There is no `curve`
  option. The line is anchored at kick-off and runs to full time.
- **Things the chart doesn't draw are children.** Bookings and substitutions accumulate nothing, so
  they are not series. `useRaceChart()` gives a child `scaleX(minute, period)`,
  `scaleY` and `valueAt(seriesId, time, period)`, which puts a mark on a team's line rather than
  beside it.
- **Paint order is lines, then marks and labels, then children.** Drawn per series, the second
  team's line runs over the first team's goal markers.
- **The end label sits above the leader's line and below every other.** Labels move apart, not
  towards each other, so close totals don't overprint. A label below its line clears the line's
  own earlier step (a cumulative line only rises, so its lowest part under a right-aligned label
  is its level at the label's left edge). Only the value is printed, since the legend names the
  series, and a surface-coloured halo keeps the text legible where it crosses a line. The leader
  never flips below: a leader that dropped under its line would land on the trailing labels, so the
  axis ceiling is chosen to leave room above the highest total instead (2.36 rounds to 2.5, about
  10px of air on a phone against the 24 a label needs, so it goes to 3). A pinned `maxValue` is
  honoured and the label runs into the padding. A trailing label too near the baseline goes above.
  Three or more series are not handled: the non-leaders all go below their lines.
- **Responsive by default, as for `<Pitch>`.** `width` and `height` together are the opt-out. Below
  420 px the default box is 1.4:1 instead of 2:1, because a 2:1 plot on a phone is barely taller
  than its own axis labels.
- **Touch is handled for this chart.** `touch-action: pan-y` so a horizontal drag scrubs the
  crosshair and a vertical one scrolls. On touch, `pointerleave` fires the moment the finger lifts,
  so clearing on it wipes the readout in the same gesture; a touch readout persists until a press
  outside the chart. A browser's device emulation reports every pointer as touch, which is how a
  readout that never clears shows up on a desktop.
- **It server-renders.** SVG only, with a nominal-size fallback before the first measurement.

Not built yet: keyboard focus giving the same readout as hover, and a table view of the values.
Neither exists anywhere in the library.

### Match momentum

`<MomentumChart>` ([D25](./decisions.md#d25-momentumchart-signed-values-bars-to-the-next-sample-our-own-icons))
follows the same pattern with a different shape of data.

```
MomentumChart (root)
 ├─ data      (one flat list, grouped by its period accessor; data stays on the root)
 ├─ panels    (one per period, width proportional to its minutes; per-panel x scale)
 ├─ scaleY    (one symmetric value scale, -max..+max, so both halves are comparable)
 ├─ bars, zero line, minute ticks, then event icons, then children
 └─ crosshair (one hit area across the panels)
```

- **`core/momentum/` owns the maths.** `computeMomentumBars` turns samples into bars, `barAtMinute`
  finds the bar under a minute, `layoutMomentumPanels` splits the width, `momentumExtent` picks the
  symmetric axis, and `stackOffsets` fans out icons that would touch. All take plain numbers.
- **A bar runs to the next sample's minute.** Sorted by time; a duplicate minute keeps the later
  sample; non-finite values are dropped; the last bar takes the period's median interval (1 minute
  for a single sample). Bars are clipped to the period's range.
- **Periods come from the data.** A period starts at its nominal minute (0, 45, 90, 105, then 15-
  minute blocks) and ends at `max(nominal end, ceil(latest sample end))`; `periodRanges` overrides
  either end, keyed by period number.
- **Samples and events are flat lists tagged with their period**, as feeds give them.
  `groupByPeriod` (in `core/chart/`) groups the samples into one panel per period, from 1 to the
  highest seen and at least two, so an empty period keeps its place; a bar's `index` is mapped back
  into `data`. An event is drawn in its period's panel (`minuteToX(panels, minute, period)`,
  clamped to that panel), and the readout lists only the hovered period's events. An event with
  no panel for its period isn't drawn
  ([D28](./decisions.md#d28-time-based-charts-require-a-period)).
- **Events are icons in a strip under the bars**, kept to one row: icons that would touch
  fan out with an offset, later over earlier on a surface backing, and a run is re-centred on its
  true minutes. A card or own goal is drawn in its own
  colour with an underline in the team's; other icons take the team colour. Icon colour rules are
  exported as pure functions because happy-dom drops `color: var(--…)` from `style`, so they are
  tested as functions.
- **The readout is shared with `<RaceChart>`.** `chart-readout.tsx` holds the card (which flips
  left of the crosshair past half width) and the press-outside dismissal. Touch behaves as for the
  race chart.
- **Below 420 px** the box is 1.8:1 rather than 3:1 and icons shrink from 16 to 14 px.

### Player radar

`<RadarChart>` ([D26](./decisions.md#d26-radarchart-callers-numbers-translucent-shapes-click-to-replace)) is the
first polar chart.

```
RadarChart (root)
 ├─ metrics   (the axes, clockwise from the top; each with its own min/max and flip)
 ├─ geometry  (centre, inner radius = one ring, outer radius = what the labels leave)
 ├─ bands, spokes, shapes (two-tone bands for one series), ring values, children
 ├─ hit disc  (pointer picks the nearest axis by angle) and labels (buttons with renderDetail)
 └─ detail    (DetailView replaces the SVG while a metric is selected)
```

- **`core/polar/` owns the maths.** `axisAngle` and its inverse `nearestAxis` (pointer to axis),
  `polarPoint`, `normaliseMetric` (range, flip, clamp), `ringSteps`/`ringValues` (flip-aware),
  `ringPath`, and for labels `labelPlacement` (rotation, anchor, first-line offset for each
  `labelRotation`, with the 180° upright turn), `wrapLabel`, `labelMargin` and `labelBox` (the
  24px hit target), plus `metricLabelLines` and `polarLayout` (label margin to centre and outer
  radius). Text is estimated with `GLYPH_WIDTH`, since the charts render on the server. All take
  plain numbers. Radar and pizza share their React glue in the internal `polar-parts.tsx`: legend,
  label lines, readout body, `placer` and the hook context.
- **The margin is what the labels need.** Tangent labels need their wrapped height round the rim,
  radial ones their length, horizontal ones both. The centre circle is one ring wide, as in
  mplsoccer, so a value at `min` still sits off the centre.
- **Bands are rings, not stacked discs.** Each band is one even-odd path, so translucent grid
  colours don't accumulate where circles overlap.
- **The detail swap** is `chart-detail.tsx`: `useDetailSelection` (uncontrolled unless
  `selected` is passed, and it returns focus to the element that opened the detail, found by its
  `data-pitchkit-metric`) and `DetailView` (Back, Escape, focus on the heading, a 150ms fade
  that respects reduced motion).
- **Shared with the other charts:** `useChartBox()` (responsive sizing), `chart-tokens.ts`
  (`--pitch-*` fallbacks), `ChartReadout` and `warnInDevelopment()`.
- **Below 420 px** labels shrink a step and ring values are hidden by default.

### Player pizza

`<PizzaChart>` ([D27](./decisions.md#d27-pizzachart-slices-coloured-by-group-series-side-by-side-or-overlaid))
is the second polar chart and reuses the radar's maths, margins, label rendering, selection and detail view.

```
PizzaChart (root)
 ├─ metrics   (the slices, clockwise from the top; each with its own min/max, flip and group)
 ├─ geometry  (centre, a hole one fifth of the radius, outer radius = what the labels and rim leave)
 ├─ rings (dashed at each quarter, solid at the rim)
 ├─ one wedge per metric: tinted blanks, then slices, then value boxes, rim arc and label
 └─ detail    (DetailView replaces the SVG while a slice is selected)
```

- **`core/polar/` supplies the wedge geometry**: `wedgeAngles` (a slice's span), `splitWedge`
  (one sub-wedge per series), `annularSectorPath` (the slice with the hole cut out, its edges pulled in
  by a pixel inset so gaps keep one width from hole to rim), `overlayOrder` (longest drawn slice first, by tip radius, so a `lowerIsBetter` metric orders correctly), and for
  value boxes `wedgeMid`, `wedgeLane` and `valueBoxSpot`. The label, ring and normalisation maths is the radar's.
- **Each (metric, series) is one cell** with its wedge, tip radius, value and paint. Side by side gives a
  cell its own sub-wedge; overlay gives every cell the full wedge and draws them in `overlayOrder`.
- **Paint is resolved per cell**: one series takes its metric's group paint, several take their series'
  paint, and the group paint goes on the rim arc. Every part of a cell paints with `currentColor`.
- **Interaction is on the slice.** Each slice carries `data-pitchkit-metric` and `data-pitchkit-series`
  and, with `renderDetail`, is a focusable button; a hover over any part of a wedge opens the readout.

## Goal view

`<GoalView>` ([D29](./decisions.md#d29-goalview-a-third-coordinate-root-with-the-providers-goal-mouth-frame))
is a third coordinate root: the goal mouth from in front, rather than the pitch from above.

```
GoalView (root, type = goal-mouth frame)
 ├─ layout    (computeGoalLayout: the fixed window fitted into the box, pixels per metre)
 ├─ backdrop, ground, ground markings in perspective, penalty spot (clipped to the ground)
 ├─ net, posts, crossbar, then the width and height markers
 └─ children  (<GoalShots>, or marks placed with useGoalView().toPixel)
```

- **`core/goal/` owns the maths.** `frames.ts` has the provider frames and `toGoalMetres` /
  `fromGoalMetres`; `layout.ts` the window, `computeGoalLayout`, `goalPlaneToPixel`, `projectGround`
  and `goalPoint` (frame units to pixels, pinned to the window with an inset); `geometry.ts` every
  static shape (`computeGoalGeometry`). Nothing imports `dimensions/` or `transform/`.
- **Two planes, one scale.** The goal line is the picture plane: a shot maps linearly, at `scale`
  pixels per metre. The ground uses the same scale at the goal line and recedes towards a camera
  `GOAL_CAMERA_DISTANCE` out and `GOAL_CAMERA_HEIGHT` up, so a ground point `depth` metres out
  is drawn at `scale × distance / (distance − depth)`.
- **Ground markings are clipped to the ground.** The six-yard box and penalty area are wider than
  the view, so only their front lines show; the clip keeps their sides out of a letterboxed box.
- **Responsive by default**, at the fixed `GOAL_VIEW_ASPECT`, with the same nominal-width fallback
  as `<Pitch>`. A fixed `width`/`height` of another shape centres the view inside it.

## Packages

npm workspaces + Turborepo.

| Package / path             | Role                                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@pitchkit/core`           | Dimensions, transforms, scene model, geometry, Canvas painters. Zero runtime dependencies, no React.                                                  |
| `@pitchkit/react`          | Declarative components (`<Pitch>`, `<Scatter>`, …), responsive sizing, tooltips, `usePitch()`. Depends only on `core`. Ships the bundled Agent Skill. |
| `@pitchkit/data-providers` | Open-data loaders: `/statsbomb`, `/skillcorner`, `/wyscout`. Depends on neither `core` nor `react`; its one runtime dependency is `csv-parse`.        |
| `apps/docs`                | The docs and showcase site (Next.js App Router, Fumadocs, Tailwind v4).                                                                               |
| `examples/react-vite`      | Vite app for eyeballing components.                                                                                                                   |
| `examples/react-nextjs`    | Next.js app that verifies SSR under a real server.                                                                                                    |

Packages build with tsup (ESM plus `.d.ts`), tree-shakeable, `sideEffects: false`, and
publish under the `@pitchkit` scope. Recipes and theme presets are meant to ship as shadcn
registry items instead of packages
([D10](./decisions.md#d10-marks-ship-on-npm-recipes-and-theme-presets-ship-as-shadcn-registry-items)).

## React and Next.js

- `<Pitch type="…">` provides the coordinate context; layer children draw into it.
- `usePitch()` exposes the scene for advanced use. It deliberately does not expose
  `setTooltip`, so there is currently no public way to react to a mark being hovered. The
  homepage hero reads `data-pitchkit-mark` off the bubbled DOM event instead. An `onHover`
  accessor would remove the need for that if interactive recipes become common.
- SVG layers render on the server. Canvas layers are client-only and paint after hydration.
- Layers take accessor functions as props, and React Server Components can't pass functions
  to Client Components. A `<Pitch>` tree must therefore start inside a `"use client"`
  component. It is still fully server-rendered; `"use client"` only sets the
  prop-serialisation boundary.

## Responsive and multi-device

- **Responsive by default.** With no size props, `<Pitch>` fills its container via
  `ResizeObserver`. Passing both `width` and `height` fixes the size, which is the opt-out for
  exports and OG images. Before the first measurement, an aspect-ratio box keeps SSR output
  from shifting layout.
- **Canvas is `devicePixelRatio`-aware:** the backing buffer is `cssSize × dpr`, so density
  layers stay sharp on retina screens.

Designed but not built yet:

- **Touch interaction:** tap to select, with a callout above the finger, detected via
  `matchMedia('(pointer: coarse)')`. Pitch tooltips are desktop-hover only today;
  [`<RaceChart>` handles touch itself](#non-pitch-charts).
- **44×44 px hit areas** around small marks.
- **Adaptive density** at small widths: a `hideBelow` prop for labels, thinner strokes.
- **`touch-action: pan-y`** on the pitch root, so a vertical swipe scrolls the page.
  `<RaceChart>` already sets it.

## Theming and styling

Colours are CSS variables only
([D8](./decisions.md#d8-theming-is-css-variables-only)). The user-facing guide, with the full
variable list, is on the [Styling pages](https://www.pitchkitjs.com/docs/styling/theming).

- **Source of truth:** `--pitch-*` custom properties with built-in fallbacks in every
  `var()`. Dark mode is a second override; a per-chart change is a wrapper element.
- **Both renderers read the same variables.** SVG gets them through `var()` in inline
  styles; Canvas reads them with `getComputedStyle` at draw time.
- **Data-driven colour** uses accessors. Any prop can be a static value or a function of the
  datum, and may return a variable reference such as `"var(--pitch-marker-goal)"`.
- **Resolution order per property:** accessor prop → static prop → `className` (only when
  neither is given) → CSS variable default → built-in fallback. Themed defaults are inline
  styles, which is why a mark drops its default when given a `className`
  ([D9](./decisions.md#d9-tailwind-reaches-pitchkit-four-ways)).
- **The pitch background** (outline, stripes, markings) isn't a mark. It is restyled only
  through variables, never through `className` on its shapes (see `core/theme/part-style.ts`).
- **`pitchTokens`** maps names to variable names for editor autocomplete; values live in CSS.
  Its `markerMiss` token is exported, but no component reads it yet.
- **Chart variables** share the `--pitch-*` namespace: `--pitch-series-1` to `-6` (by slot, so
  colour follows the entity), `--pitch-axis`, `--pitch-grid`, `--pitch-chart-surface` (the ring
  around a marker, which has to match whatever is behind the chart, since `<RaceChart>` paints no
  background), `--pitch-chart-text` and `--pitch-chart-muted`. Chart chrome has no prop equivalent.
- **Theme presets** (classic grass, dark broadcast, print, colour-blind-safe) are planned as
  shadcn registry items, e.g. `npx shadcn add @pitchkit/theme-broadcast`. They depend on the
  registry infrastructure, which doesn't exist yet.

## Accessibility

Targets. Apart from the tooltip's `role="tooltip"`, none of these is implemented yet:

- SVG marks carry `role`/`aria-label`, and the pitch exposes an accessible description.
- Keyboard navigation across discrete marks; visible focus states.
- Transitions respect `prefers-reduced-motion`.
- Recipes never encode meaning by colour alone.
- Density layers default to a colour-blind-safe scale. `colorMin`/`colorMax` are per-instance
  props outside the CSS-variable path, so they need their own validated default (for
  example Wong's blue→orange), not an arbitrary green→red.
- Density layers get an optional pattern for pairing the chart with a visually hidden data
  table of the same binned values.

## Performance budgets

- 60 fps interaction on a mid-range phone for a typical event layer (1–3k marks) via SVG;
  switch to Canvas above a threshold.
- Tracking-data scatter (10 Hz frames, thousands of points) goes to Canvas, or WebGL later.
- Heavy layers (KDE, Voronoi) are code-split so a simple shot map ships minimal JS.
- A benchmark harness in CI tracking render time and bundle size per package (not built yet).

## Data loaders

- Loaders keep each provider's own vocabulary; only coordinates are lifted, and
  interpretation lives in predicates
  ([D14](./decisions.md#d14-the-providers-data-stays-the-providers)).
- Each loader layer is usable on its own: `parse*` (pure), `load*`/`fetch*` (network),
  selectors (`shots()`, `passes()`), and predicates (`isGoal`, `isComplete`).
- Accessors mean PitchKit reads any data shape, so consumers with their own pipeline don't
  need this package at all.
- Every provider asks to be credited when its data is published. The terms are on the
  [Data overview](https://www.pitchkitjs.com/docs/data) and in the
  `@pitchkit/data-providers` README.

Facts about the datasets that the loaders depend on are in
[data provider facts](#data-provider-facts).

---

## Docs site

`apps/docs` is a Next.js App Router site on Fumadocs and Tailwind v4, in the shadcn/ui design
language. It is live at [pitchkitjs.com](https://www.pitchkitjs.com).

- **Landing page:** a hero carousel of real gallery charts, a feature grid, an FAQ, and a
  contact footer.
- **Live examples:** every docs example is a standalone `*-basic.tsx` (or `*-gallery.tsx`)
  file in `components/examples/`, rendered by `<PitchPreview name="…" />` with its source
  shown beside it and "Open in StackBlitz/CodeSandbox" buttons. Each example is a complete,
  copy-pasteable file, not a fragment.
- **API reference:** generated from TSDoc with TypeDoc into `content/docs/api/`.
- **Guides:** Quickstart, Guides, Components, Overlays, Charts, Agents, Styling, Data, and the
  mplsoccer → PitchKit migration page.
- **Gallery:** `/gallery`, finished visualisations with full source, in Shooting, Passing,
  Structure, Density and Timeline categories.
- **For agents:** `/llms.txt`, `/llms-full.txt`, `/llms-api.txt`, and per-page Markdown
  (append `.md` to any docs URL) ([D19](./decisions.md#d19-llmstxt-covers-the-narrative-docs-the-api-reference-is-separate)).

See [docs site conventions](#docs-site-conventions) for how to work in it.

---

## Engineering standards

| Area       | Standard                                                      | As built                                                                                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language   | TypeScript, strict                                            | Yes                                                                                                                                                                                                                                       |
| Build      | tsup, Turborepo                                               | Yes (npm workspaces, not pnpm)                                                                                                                                                                                                            |
| Tests      | Vitest; happy-dom for components; Playwright visual snapshots | Vitest + happy-dom. `@pitchkit/core` held at 100% coverage. No visual regression yet.                                                                                                                                                     |
| Quality    | ESLint, Prettier, typecheck in CI, size budgets               | ESLint, Prettier, typecheck. No size budgets yet.                                                                                                                                                                                         |
| CI         | Lint, typecheck, test, build on every PR                      | `.github/workflows/ci.yml`                                                                                                                                                                                                                |
| Releases   | Changesets for semver and changelogs; automated npm publish   | Changesets yes; publishing is manual ([D11](./decisions.md#d11-releases-are-manual-until-trusted-publishing-is-set-up))                                                                                                                   |
| Docs       | Vercel                                                        | Auto-deploys every push to `main` via Vercel's GitHub App (no workflow or `vercel.json` in the repo). PRs get preview deployments. Deploys don't wait for CI.                                                                             |
| Dependency | Published packages keep a minimal runtime footprint           | `core`: none. `react`: `core` only (React is a peer). `data-providers`: `csv-parse` only. Dependabot alerts are in build/dev tooling or the private `apps/` and `examples/` workspaces, never a published package's runtime dependencies. |

---

## Developer mental model

Five things to hold in your head when building with PitchKit:

1. **`<Pitch>` owns the coordinate system.** Declare the provider with `type`.
2. **Children are layers, stacked in render order.** `<Scatter>`, `<Arrows>`, `<Heatmap>`
   compose like HTML elements.
3. **Accessors map data to visuals.** Any visual prop is a static value or a typed function
   of the datum: `x={(d) => d.location[0]}`.
4. **Colours are CSS variables.** Set once, dark mode by override, per chart by wrapper.
5. **Tailwind reaches marks by `className`, and the background by variable utilities.**
   Never fight the inline style; hand the property to the class instead.

---

## Implementation notes

Things that aren't obvious from the code and have caused real bugs.

### Shared-maths extraction

`@pitchkit/react` re-emits SVG as JSX rather than reusing core's DOM painters. That is the
only way to get `renderToString`-able output. It must still share all of core's maths:
transforms, geometry, arc/arrow/comet shapes, part styles. When a new mark or appearance
change needs logic, extract it into a pure exported function in `core` first (see
`theme/part-style.ts`, `scene/appearance.ts`, `render/arrow-geometry.ts`,
`render/comet-geometry.ts`), then call it from both sides.

`partStyle()` returns a CSS string; React's `style` prop needs an object.
`packages/react/src/style-string.ts` bridges the two. Don't change `partStyle`'s format for
React's sake; add to the bridge instead.

### `Layer` is erased to `any`

`Layer` is `any`, not `unknown`, in `scene/types.ts`, on purpose. Accessor parameters make
`ScatterLayer<T>` invariant in `T` under `strictFunctionTypes`, so a concrete layer can't
widen to `ScatterLayer<unknown>` for storage in the heterogeneous `layers` array.

### Centre-origin pitches

The extent-frame conversion for centre-origin grids was needed in more places than the
transform, and each omission fails silently:

- `scene/geometry.ts`: without it, markings are double-shifted.
- The default crop in `transform/pixel-transform.ts`.
- `cropForHalf`.
- The four density modules (`heatmap/bins`, `heatmap/positional`, `hexbin/bins`,
  `kde/density`). Their `if (x < 0 || x > dimensions.length) return;` bounds checks would
  discard a centre-origin pitch's whole defending half.
- `geometry/flow`, which has the same bounds check and builds bin centres in the extent frame.
- Anything that _returns_ geometry built in the extent frame converts it back:
  `computePositionalZones`' rectangles, `computeFlowBins`' arrow starts, the pitch rectangle
  `paint-hexbin` clips to, and the KDE grid cells `paint-kde` draws. Converting in but not out counts correctly and draws half a pitch away
  ([#90](https://github.com/yribeiro/pitchkit/issues/90)).

Any new module that reasons about a `0..length` box must convert through the extent frame
first, and back out of it for anything it hands to `toPixel`. Tests that assumed the minimum corner is `(0, 0)` now derive it from
`dimensions.origin`.

### Build and test gotchas

- **`typecheck` depends on `^build`** in `turbo.json`. `@pitchkit/react` resolves
  `@pitchkit/core`'s types through its built `dist/`, so on a fresh checkout the typecheck
  would fail without it. Verify task dependencies from a clean
  `rm -rf packages/*/dist .turbo`, not from a session that already has builds lying around.
- **The docs build is never Turbo-cached** (`apps/docs/turbo.json`). When Turbo replays a
  cached `next build`, it restores `.next/` but Next.js never runs, so Vercel's build output
  (written outside `.next/`) is missing and the deploy fails after "Build Completed". Any
  commit that doesn't touch `apps/docs` would hit this, in production as well as previews.
- **`"use client"` in tsup output:** tsup's `banner` option is silently dropped by esbuild
  when it looks like a directive. `packages/react/scripts/add-use-client.mjs` prepends it
  after bundling; copy that pattern for any package that needs it.
- **Stale workspace builds in dev servers:** after rebuilding `core` or `react`, a running
  Vite or Next.js dev server can keep serving the old `dist/`. Restart it (for Vite, also
  clear `examples/react-vite/node_modules/.vite`); HMR won't pick it up.
- **Canvas under test:** happy-dom's `<canvas>` returns `null` from `getContext("2d")`.
  Painting is verified against a hand-rolled mock context (see
  `render/canvas/paint-heatmap.test.ts`), stubbed in with `vi.spyOn` where needed.
- **Hover in tests:** use `fireEvent.mouseEnter`/`mouseLeave` from `@testing-library/react`.
  A raw `dispatchEvent(new MouseEvent("mouseenter"))` doesn't trigger React's handlers, and
  neither does CDP-driven hover in browser automation.

### Docs site conventions

- **Generated inputs:** `components/examples/registry.ts` and `content/docs/api/` are
  gitignored and generated by `next.config.ts` on every start
  ([D18](./decisions.md#d18-docs-generators-run-from-nextconfigts)).
- **Examples:** add a `*-basic.tsx` file to `components/examples/` and reference it from MDX
  as `<PitchPreview name="…" />`. MDX renders as a Server Component, so accessor functions
  have to originate in the example file itself.
- **Tailwind class strings must be written out in full.** Tailwind only generates classes it
  finds verbatim in source, so `pitch-surface-${colour}` renders unstyled.
- **API reference module names:** each entry point in `packages/data-providers/src` carries
  a TSDoc `@module` tag. Without it TypeDoc names multi-entry modules by source path, and the
  URLs come out as `/docs/api/data-providers/packages/data-providers/src/statsbomb/…`.
- **Moving a page:** add a permanent redirect for the old URL, and its `.md` variant, to
  `redirects()` in `next.config.ts`. External links and published READMEs point at docs
  URLs.
- **The PitchKit mark** is duplicated across five files with nothing linking them. Read
  [CONTRIBUTING.md: brand assets](../CONTRIBUTING.md#brand-assets) first.

---

## Data provider facts

Each of these was verified against the live data, not assumed, and the loaders depend on it.
Re-verify against a fresh sample before "correcting" any of them.

### StatsBomb

- Open data is fetched from `raw.githubusercontent.com/statsbomb/open-data`. The docs
  examples use Euro 2024 (competition 55, season 282), where all 51 matches have 360 data.
- 360 frames join onto events by `event_uuid`; `indexThreeSixtyByEvent` does the join.
- **Period 5 is the penalty shootout, and its penalties carry xG.** England 1-1 Switzerland
  (`3942227`) has 9 shots in period 5, all `shot.type = "Penalty"`, worth 7.05 xG against 1.74
  across periods 1 to 4. `shots(events)` alone ends an xG chart at 8.79. Filter `period <= 4`.
- **Extra time reaches minute 121.** The same match runs period 3 to 105' and period 4 to 121', so
  an axis fixed at 90 clips it.
- **Halves don't end on 45.** Stoppage time is inside `minute`: the Euro 2024 final (`3943043`)
  has period 1 running to 47' and the match to 94'. A half-time rule drawn at 45 is in the wrong
  place. The second half's minutes restart at 45, so 45'–47' occur in both periods: Williams' goal
  is at period 2, 46:09.
- **A booking is `foul_committed.card`.** The final has four, all there. A booking without a foul
  would be under `bad_behaviour.card`, but none occurs in that match, so it is unverified.
- **Every team attacks towards x = 120 in both halves.** Verified on the Euro 2024 final
  (`3943043`): shots by either side land at x of about 104 to 109, in both periods. So the attacking
  third is `x >= 80` for both teams and the away side's coordinates are not flipped. The docs
  momentum example counts on-ball events there per minute, home minus away, smoothed over three
  minutes. That is a derivation, not a StatsBomb metric: no momentum value exists in the feed.

- **Goal-mouth coordinates are yards on the pitch's own `y`, with the posts at 36 and 44 and the
  bar at 2.67 (8 ft).** In 20 Euro 2024 matches, 53 goals ended at `y` 36.1 to 43.8 and `z` up to 2.4,
  and the 10 shots that hit the woodwork at `y` 36.1, 44.1 or `z` 2.7 to 3.0. A smaller `y` is the
  shooter's left. `<GoalView type="statsbomb">` depends on this.
- **Only some shots have a height.** `Blocked` and `Wayward` shots have a two-value `end_location`
  (no `z`); every `Goal`, `Saved`, `Off T` and `Post` in that sample has three. A `Saved` shot's `x`
  is 112 to 119.5: it ends where the keeper got to it, in front of the line.

### SkillCorner

- **Tracking is stored in Git LFS**, so `raw.githubusercontent.com` serves a ~130-byte
  pointer stub instead of data. That's why there are two base URLs:
  `SKILLCORNER_LFS_BASE_URL` points at `media.githubusercontent.com`. This is not a typo, and a
  test asserts the two apart.
- **Tracking is about 90 MB per match** at 10 fps. `streamTracking` is an async generator;
  leaving the loop aborts the download (the docs demo pulls 1.9 MB of 86.5 MB).
  `fetchTrackingWindow` does an HTTP `Range` read from a byte-offset estimate.
- **Tracking and dynamic events use opposite x conventions.** Tracking is absolute and swaps
  ends at half time; dynamic-event `x` is normalised so positive always points at the goal
  being attacked. Confusing them silently mirrors half a match. `attackingSideOf` resolves
  tracking.
- **Pitch dimensions vary per match** (104/105/106 × 68 m). `pitchX`/`pitchY` translate by
  that match's own size and stay in its real metres. `y > 0` is the attacking team's left,
  which is "up" on a y-up pitch, so the transform is a pure translation.

### Wyscout

- **Events come from a third-party mirror.** The official release (Pappalardo et al.,
  figshare, CC BY 4.0) ships events as one 77 MB zip for all 1,941 matches.
  `koenvo/wyscout-soccer-match-event-dataset` splits it per match (~480 KB each) with no
  field renamed, which is what makes it acceptable under
  [D14](./decisions.md#d14-the-providers-data-stays-the-providers). Reference files come from
  figshare directly. There is no `fetchMatches`: the mirror publishes no JSON index.
- **Wyscout is not Opta.** Both are `0..100` on both axes, but Wyscout's origin is top-left
  with y pointing down, and Opta's is bottom-left with y pointing up. Plotting one on the
  other's type mirrors the pitch vertically, and nothing errors.
- **A goal is tagged twice:** tag 101 is on the scoring action and on the keeper's
  `Save attempt`. `shots(events).filter(isGoal)` counts each goal once; filtering the whole
  feed doesn't.
- **A shot has no end coordinate.** `positions[1]` is a placeholder for every shot,
  `Interruption` and `Offside`; the goal-mouth tags (1201–1223) record where a shot went
  (`shotGoalZone`). The exclusion is keyed on event type, not value: `(100, 100)` is a
  placeholder on a goal kick but a genuine corner-flag position on a corner.
