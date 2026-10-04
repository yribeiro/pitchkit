# Decision log

Decisions that shape how PitchKit is built, with the reason for each. Read the relevant entry
before changing something it covers. Several of these reverse an earlier decision, and the
reason is recorded so it doesn't get reversed back by accident.

Entries are grouped by area, not by date. Each one records the decision, why it was made,
and what follows from it. Superseded entries stay in the log, marked as such.

- [Architecture](#architecture)
- [Styling and theming](#styling-and-theming)
- [Distribution and releases](#distribution-and-releases)
- [Data providers](#data-providers)
- [Docs site](#docs-site)

---

## Architecture

### D1. Hybrid rendering: SVG for marks, Canvas for density

**Decision:** Pitch geometry and discrete marks (scatter, arrows, comets, hulls, Voronoi)
render as SVG. Dense raster layers (heatmap, positional heatmap, hexbin, KDE) render to
Canvas.

**Why:** SVG is crisp at any DPI, server-renderable, and DOM-addressable for tooltips and
accessibility. One DOM node per bin or point stops scaling for density layers, so those use
Canvas.

**Consequences:** Canvas layers render nothing on the server and paint after hydration.
Canvas reads the same `--pitch-*` variables as SVG, so theming stays in one place.
See [architecture: rendering](./architecture.md#rendering-svg-and-canvas).

### D2. `@pitchkit/core` has no React dependency

**Decision:** `core` owns coordinates, geometry, the scene model and painters, with zero
runtime dependencies. `@pitchkit/react` is a thin binding over it.

**Why:** It keeps the correctness-critical maths testable in isolation (core is held at
100% coverage), and leaves room for other bindings later.

**Consequences:** Shared maths lives in `core`, never in `react`. When `react` needs logic
that a core painter has, extract it into a pure exported function in `core` first. See
[architecture: shared-maths extraction](./architecture.md#shared-maths-extraction).

### D3. `@pitchkit/react` is the only supported rendering surface

**Decision:** Core's SVG painters (`render/svg/paint-*.ts`, `svgRenderer`,
`renderSceneToSVGElement`) are internal. They exist only for the
`packages/core/examples/index.html` dev harness. New mark types ship React-only.
([Issue #6](https://github.com/yribeiro/pitchkit/issues/6), resolved.)

**Why:** Maintaining a DOM painter and a React component for every mark doubled the cost of
each new mark for a consumption path nobody had asked for.

**Consequences:** Hexbin, KDE, Flow, Polygon, Convex Hull, Voronoi and Goal Angle have no
DOM painter. The internal exports carry `@internal` TSDoc. `canvasRenderer` is unaffected,
because `react`'s density layers call into it.

### D4. Responsive by default; explicit size is the opt-out

**Decision:** `<Pitch>` fills its container via `ResizeObserver` with no prop. Passing both
`width` and `height` fixes the size.

**Why:** Sensible defaults with full control. A fixed size only makes sense where there is
no container to measure (image export, OG cards, email).

**Consequences:** The first paint uses an aspect-ratio box so SSR output doesn't shift
layout before measurement.

### D5. Centre-origin coordinates are handled in core, never in callers

**Decision:** `PitchOrigin: "center"` is supported end to end through
`toExtentFrame`/`fromExtentFrame` (`transform/canonical.ts`). SkillCorner data plots with its
raw `x`/`y` on `<Pitch type="skillcorner">`.

**Why:** A caller-side workaround (`toUefaX`/`toUefaY` in `examples/react-nextjs`) squashed
SkillCorner onto a UEFA grid. It was wrong at the edges and had to be repeated by every
consumer. It has been deleted; don't reintroduce one.

**Consequences:** `toExtentFrame`/`fromExtentFrame` are identity functions for corner-origin
providers, which is why StatsBomb, Opta and UEFA are untouched; a test asserts this. Any
module that reasons about a `0..length` box must convert through the extent frame first.
See [architecture: centre-origin pitches](./architecture.md#centre-origin-pitches).

### D6. Normalised grids derive their shape from real metres

**Decision:** `displayUnitScale` (`transform/canonical.ts`) converts a normalised grid's
units to metres, using `realLengthMeters`/`realWidthMeters`, before anything derives
on-screen shape. It is gated on `normalized`, so StatsBomb, UEFA and SkillCorner render
byte-identically (their scale is `1`).

**Why:** Opta and Wyscout are `0..100` on both axes. Deriving shape from `length`/`width`
drew them square ([issue #2](https://github.com/yribeiro/pitchkit/issues/2)). The real-metre
fields existed from the start, but nothing read them. Measured at 600×400: Opta went from
aspect 1.0000 to 1.5441. Fixed via [PR #72](https://github.com/yribeiro/pitchkit/pull/72).

**Consequences:** Overriding the dimensions of a normalised grid throws. Test files derive
their pitch-type list from `Object.keys(PITCH_DIMENSIONS)` rather than hardcoding it. The
hardcoded lists had silently left `skillcorner` uncovered in six files.

### D7. SkillCorner markings don't scale with pitch size

**Decision:** `getPitchDimensions(type, { length, width })` and `<Pitch dimensions>` accept a
per-match size, used by SkillCorner's real 104–106 m pitches. Only the outline, halfway line
and goal lines move; box and circle markings keep their regulation sizes.

**Why:** A penalty area is 16.5 m on any pitch.

### D23. Non-pitch charts are roots with their own scales

**Decision:** A chart with no pitch under it (`<RaceChart>` first, radar and pizza next) is a
root component, a sibling of `<Pitch>` and not a `Layer`. It takes no `type` prop and does not go
through `createPixelTransform`. Its maths lives in `@pitchkit/core` under `chart/` (linear scales,
ticks, plot frame) and `race/` (cumulative series, step path), which import nothing from
`dimensions/`, `transform/` or `scene/`. **Every data value reaches a pixel through a scale.** The
y-axis flip lives in the scale's range, never in a component.

**Why:** Pushing a chart through `Scene`/`Layer`/`PitchDimensions` is the wrong abstraction, as
[issue #21](https://github.com/yribeiro/pitchkit/issues/21) argued before any chart existed. The
scale rule is [D5](#d5-centre-origin-coordinates-are-handled-in-core-never-in-callers) for charts:
a coordinate workaround in a caller fails silently, and this is the same class of bug. Data goes on
the root rather than on children because the y-domain is the highest total across every series, so
a root can't compute its scales without all of it. Anything the chart doesn't draw itself is a
child, positioned through `useRaceChart()` (`scaleX`, `scaleY`, `valueAt`), the counterpart of
`usePitch()`.

**Consequences:**

- [D3](#d3-pitchkitreact-is-the-only-supported-rendering-surface) applies unchanged: React-only,
  no core SVG painter. `core` takes plain numbers, not `Accessor`s, so `race/` never depends on
  `scene/`.
- `chart/` and `race/` are held at 100% coverage, enforced in `packages/core/vitest.config.ts`.
- Chart tokens stay in the `--pitch-*` namespace
  ([D8](#d8-theming-is-css-variables-only)): `--pitch-series-1` to `-6`, `--pitch-axis`,
  `--pitch-grid`, `--pitch-chart-surface`, `--pitch-chart-text`, `--pitch-chart-muted`. A second
  prefix would split the theme and cost D8 its main benefit, one declaration themes everything.
  Series colour is assigned by slot, so removing a series never repaints the others.
- The component is `<RaceChart>`, not `<XgRace>`, because the accumulating value need not be xG.
  A generic name is invisible to anyone searching "xG race chart", so the bundled skill's
  `description` and the docs page carry "xG race chart", "xG timeline" and "xG flow chart".
  `<XgFlow>` was never an option: `<Flow>` is the pass-direction layer.
- This is the first chart with no mplsoccer equivalent. mplsoccer's non-pitch charts are `Radar`,
  `PyPizza` and `Bumpy`; nothing in it is cumulative.
- Radar and pizza are polar and share none of `chart/`. They get their own module beside it, not
  under it.

### D25. `<MomentumChart>`: signed values, bars to the next sample, our own icons

**Decision:** Match momentum is one more non-pitch root ([D23](#d23-non-pitch-charts-are-roots-with-their-own-scales)),
with its maths in `core/momentum/`. Five choices shape it:

- **`value` is signed**: positive is the home side, negative the away side. One number per sample
  carries both teams, which is the shape vendors' momentum feeds already have.
- **A bar spans from its sample to the next sample's minute**, and the last bar of a period takes
  the period's median interval. Data can therefore be at any interval, and nothing has to be regular
  or the same across halves. A gap draws nothing and reads "No data", distinct from "Level" (a
  value of 0).
- **`periods` is an array of sample arrays**, one panel each, width proportional to minutes.
  Half time comes from the data: a period ends at the later of its nominal end and its last sample,
  because halves do not end on 45. Extra time is two more arrays. _Superseded by
  [D28](#d28-time-based-charts-require-a-period): samples are now one flat `data` list with a
  `period` accessor._
- **Events are a separate list**, passed as `events` plus `eventTime`/`eventSide`/`eventKind`, the
  same list-plus-accessors shape as every other prop. The four props are a type-level set: passing
  `events` alone is a compile error. `eventPeriod` joined the set later
  ([D28](#d28-time-based-charts-require-a-period)). Anything the built-in kinds don't cover is a child, positioned
  through `useMomentumChart()`.
- **The icons are PitchKit's own.** SofaScore's artwork is what prompted the chart, but it is
  another site's work and a chart library is the wrong place to redistribute it. They are drawn
  on a 24-unit grid in `currentColor` with one stroke weight.

**Why:** Signed values and span-to-next are the two choices that make arbitrary intervals work
without the caller resampling. Own icons keep the library's licence clean.

**Consequences:**

- **The kind is `missed-penalty`, not `penalty`.** A scored penalty is a goal in most feeds and is
  recorded as `goal`; the event worth its own icon is the miss.
- **The icon row is one row, and crowded icons stack with an offset.** Icons are small (13 px, 11
  on a phone); ones that would touch fan out a little right of each other, later over earlier, on
  a surface-coloured backing, and a stacked run is re-centred on where its events really were.
  The first version added rows instead (capped at two), which made a busy match's chart mostly
  icons and still overprinted on a phone. A stack keeps the chart's height fixed. Eight
  substitutions in one minute are still a pile, so substitutions are better left out or drawn as
  children.
- **Cards and own goals carry their meaning in colour**, so they cannot also carry the team: they
  get an underline in the team's colour. Every other icon is the team's colour. New token:
  `--pitch-card-red`; `--pitch-card-yellow`, already in use, joins `pitchTokens`.
- **PitchKit draws momentum and does not compute it.** There is no standard metric and no open feed
  publishes one. The docs example derives one from StatsBomb events and says so.
- `momentum/` is held at 100% coverage. The readout card and outside-press dismissal are shared with
  `<RaceChart>` in `chart-readout.tsx`.
- Like `<RaceChart>` it has no mplsoccer equivalent.

### D26. `<RadarChart>`: caller's numbers, translucent shapes, click to replace

**Decision:** `<RadarChart>` is a non-pitch root
([D23](#d23-non-pitch-charts-are-roots-with-their-own-scales)) with its maths in `core/polar/`.

- **`metrics` are the axes and `series` the shapes**: `{ id, label, min, max, lowerIsBetter }` per
  metric, and `values` keyed by metric id per series. Its types are radar-only (`RadarMetric`,
  `RadarSeries`, `RadarSelection`, `RadarDetailContext`); nothing is carried for charts that don't
  exist yet.
- **The chart computes nothing.** Per-90s, percentiles and ranges are the caller's. The only
  arithmetic is placing a value between its metric's `min` and `max` (0–100 by default), with the
  lower-is-better flip and a clamp. A clamped value sits at the rim and the readout marks it "off
  scale"; a missing one takes the outline to the centre.
- **Shapes are translucent, with no vertex markers.** The outline bends at each value. A single
  series keeps mplsoccer's two-tone banding, as two light tints of the series colour so the grid
  and ring values show through.
- **Labels follow the axis angle**, set by `labelRotation`: `"tangent"` (default, mplsoccer's),
  `"radial"`, or `"horizontal"`. Text that would read upside down turns 180°.
- **Clicking replaces the chart.** With `renderDetail`, axis labels become buttons; activating one
  swaps the chart for the caller's component in the same box, under a header with a Back button.
  Escape and `close()` also return, and focus goes back to the label. `selected`/`onSelectedChange`
  make it controllable. Without `renderDetail` nothing is clickable.
- **A series paints with `currentColor`.** One class (`text-rose-500`) recolours every part of it,
  outline and wash. This extends D9 to multi-part marks; a `className` with no `color` still drops
  the themed default.

**Why:** Computing nothing keeps the chart honest about where numbers come from, which matters for
percentiles, whose population is a choice. Replacing the chart, rather than a popover, gives the
detail the room it needs, which is usually another chart.

**Consequences:**

- **Three series is the readable limit.** Overlaid shapes are an all-pairs comparison: every shape
  overlaps every other. The dataviz validator clears only the first three palette slots on all
  pairs, so a fourth draws with a development warning. The docs theme defines a validated
  `--pitch-series-3` for light and dark.
- `polar/` is held at 100% coverage. Responsive sizing, the chart tokens, the readout row and the
  chart contexts are shared by every non-pitch chart.
- The gallery gains a **Profiles** category for player-profile charts.
- `<RadarChart>` is mplsoccer parity for `Radar`; the click-to-detail swap is not in mplsoccer.

### D27. `<PizzaChart>`: slices coloured by group, series side by side or overlaid

**Decision:** `<PizzaChart>` is the second polar chart, built the way `<RadarChart>`
([D26](#d26-radarchart-callers-numbers-translucent-shapes-click-to-replace)) is: a non-pitch root with
its geometry in `core/polar/`, drawing the caller's numbers and computing nothing. Its types are its own
(`PizzaMetric`, `PizzaSeries`, `PizzaSelection`, `PizzaDetailContext`), and `PizzaSelection` and the
`renderDetail` context carry the series whose slice was clicked, which a radar axis doesn't have.

- **One series colours by group; several colour by series.** A metric's `group` ("Attacking") sets the
  slice colour for a single player, taking `--pitch-series-1`, `-2`, `-3`… in order of first appearance,
  or the colour or class given in `groups`. With several series, colour identifies the player and the
  group moves to an arc on the rim, coloured from the slots after the series' so no arc
  repeats a player's colour.
- **`seriesLayout` is the caller's choice**: `"side-by-side"` (default) splits each metric's wedge into
  one thin wedge per series; `"overlay"` gives every series the full wedge, drawn largest first so a
  smaller one stays visible. Side by side is readable to three series and overlay to two; past that a
  series still draws, with a development warning.
- **Slices are the buttons.** With `renderDetail`, each slice is focusable and opens the caller's
  component in place of the chart, with the same Back button, Escape and focus return as the radar
  (`selected`/`onSelectedChange` take `{ metricId, seriesId }`). A focused slice draws its own ring, since
  the browser's box would wrap the bounding box of a curved slice.
- **Value boxes are on by default**: at the tip for one series, in a lane per series for an overlay (so
  close values never print on top of each other), centred on each wedge side by side, and dropped on a
  slice too narrow to hold one. Boxes use the surface colour with a series-coloured
  outline and chart text, never the series colour as text.
- **Percentiles are the caller's.** Values default to 0–100, which is what a percentile is, with
  `lowerIsBetter` flipping a slice so a long one is always the good one.

**Why:** A pizza reads as categories first (what a player does), so a single player takes the group
colours; comparing players needs colour to say who, so it takes that over. Both layouts exist because
they trade off: side by side hides nothing, overlay compares the same metric directly but only for two.

**Consequences:**

- The radar's selection and detail view are now shared (`chart-detail.tsx`), as is the focus return
  by `data-pitchkit-metric` and `data-pitchkit-series`.
- `core/polar/` gains `wedgeAngles`, `splitWedge`, `annularSectorPath` and `overlayOrder`, at 100%
  coverage. Path coordinates are rounded to two decimals so floating-point dust doesn't reach the markup.
- `<PizzaChart>` is mplsoccer parity for `PyPizza`. mplsoccer only overlays two series and has no
  click-to-detail.

### D28. Time-based charts require a period

**Decision:** Every event `<MomentumChart>` draws and every datum `<RaceChart>` accumulates carries
its period: `eventPeriod` and `period` are required accessors, and the hooks' `scaleX(minute,
period)` and `valueAt(seriesId, time, period)` take one too. A period is the feed's own number, 1
for the first half, so StatsBomb's `period` field plugs straight in. `<RaceChart>` draws each
period after the one before, in its own panel (`layoutMomentumPanels` with no gap), instead of on
one 0–90 axis.

**Every time-based input is the same shape: one flat list, each row tagged with its period by an
accessor.** `<MomentumChart>`'s samples moved from `periods` (an array of arrays, one per half) to
`data` plus a `period` accessor, the same as its events and as `<RaceChart>`'s series data.
`periodRanges` is keyed by period number.

**Why:** Feeds restart the clock at 45 for the second half, so a first half with stoppage time and
the second half share minutes 45'–48'. A minute alone can't place an event in that overlap, and it
happens in most matches: in 5 of 8 Euro 2024 matches checked, a second-half goal, card or
substitution fell inside the first half's stoppage minutes
([issue #82](https://github.com/yribeiro/pitchkit/issues/82)). An optional period would have kept
the wrong placement as the default for exactly the data these charts are for. The packages are
pre-1.0, so the break was taken rather than carried. Feeds tag every row with its period rather
than splitting them, so a flat list is what a caller already has; with samples split by position
and events tagged by accessor, the same chart had two ways to say which half something was in, and
an empty half had to keep its slot by hand or every later period shifted.

**Consequences:**

- `groupByPeriod` in `core/chart/` is the one rule for which periods get a panel: every period from
  1 to the highest seen, at least two. Both charts use it.
- `core` sorts a race by period, then minute (`computeCumulativeSeries`), and `valueAtTime` counts
  every earlier period. `racePeriodRanges` gives each period its nominal range extended to its own
  last event, the rule `<MomentumChart>` already used.
- `<RaceChart>`'s half-time rule now sits where the first half's panel ends, at least 45', rather
  than at the first half's last shot.
- An event or datum whose period isn't a whole number from 1, or that `<MomentumChart>` has no
  panel for, is not drawn.
- `MomentumHover.period` changed from a zero-based index to the 1-based period number, so one
  chart doesn't use two conventions.

---

## Styling and theming

### D8. Theming is CSS variables only

**Decision:** Colours are `--pitch-*` CSS custom properties, shadcn-style. There are no JS
theme objects and no theme provider. The `appearance` prop controls structure (stripes,
goal style, `linesOnTop`), never colour.

**Why:** Variables cascade, so one declaration themes every chart, dark mode is a second
override, and a per-chart change is a wrapper element. Canvas reads the same variables at
draw time, so both renderers share one source.

**Consequences:** `pitchTokens` exists only for editor autocomplete; values always live in
CSS. The full variable list is on the
[Theming page](https://www.pitchkitjs.com/docs/styling/theming). It must match what the
components read; an audit in [PR #74](https://github.com/yribeiro/pitchkit/pull/74) found
three variables missing from it.

### D9. Tailwind reaches PitchKit four ways

**Decision:** ([Issue #7](https://github.com/yribeiro/pitchkit/issues/7),
[PR #13](https://github.com/yribeiro/pitchkit/pull/13).)

1. `className` on SVG marks you render. When `className` is set and the matching colour prop
   is absent, the mark drops its themed default.
2. `data-pitchkit-mark`/`-layer`/`-part` attributes, reached with arbitrary-variant selectors
   and the `!` important modifier, for marks whose JSX you don't own.
3. A `pitch-surface-*`/`pitch-stripe-*`/`pitch-lines-*` `@utility` recipe
   (`--value(--color-*)`) for the pitch background.
4. `pitch-line-width-*`, which takes a number.

**Why:** Themed defaults are applied as inline `style`, and inline style always beats a
class. Adding `className` alone would have done nothing for colour. The pitch background
isn't a mark, so it is only restyled through variables.

**Consequences:** Resolution order per visual property: accessor prop → static prop →
`className` (only if neither is given) → CSS variable default → built-in fallback.
Eight layers honour mechanism 1: Scatter, Arrows, Comet, Annotate, Polygon, ConvexHull,
Voronoi and GoalAngle. Flow takes its colours from `colorMin`/`colorMax`.

---

## Distribution and releases

### D10. Marks ship on npm; recipes and theme presets ship as shadcn registry items

**Decision:** `@pitchkit/core`, `@pitchkit/react` and `@pitchkit/data-providers` are npm
packages. Composite recipes (pass network, shot map, pass map, …) and theme presets are
shadcn registry items: `npx shadcn add pass-map` copies the source into the consumer's repo,
with `@pitchkit/react` auto-installed underneath.

**Why:** Marks are correctness-critical plumbing that nobody should fork. Recipes are
opinionated compositions a consumer wants to own and restyle without waiting on a release.
This is the same split shadcn/ui uses: its components are copied, and Radix underneath them
is installed from npm.

**Consequences:** The registry infrastructure does not exist yet: `apps/docs` has only an
internal examples registry, not a consumable `registry.json`. The recipe issues
([#23](https://github.com/yribeiro/pitchkit/issues/23),
[#24](https://github.com/yribeiro/pitchkit/issues/24)) depend on building it.

### D11. Releases are manual until Trusted Publishing is set up

**Decision:** Changesets drives versions and changelogs, but publishing is run by hand.
`.github/workflows/release.yml` is disabled.

**Why:** The workflow failed with `ENEEDAUTH` because no `NPM_TOKEN` was configured. The
preferred fix is npm Trusted Publishing (OIDC), which avoids storing a token and adds
provenance. Tracked in [issue #36](https://github.com/yribeiro/pitchkit/issues/36).

**Consequences:** See [CONTRIBUTING.md: releasing](../CONTRIBUTING.md#releasing) for the
steps. A change to `packages/react/skills/` ships in the tarball, so it needs a changeset
like any code change. [PR #63](https://github.com/yribeiro/pitchkit/pull/63) shipped
without one, and its fix sat unreleased.

### D12. The Agent Skill ships inside `@pitchkit/react`

**Decision:** `skills/pitchkit/` (`SKILL.md` plus `references/api.md`) is in the npm
tarball. `npx @pitchkit/react skills install` symlinks it into a consumer's project.
([PR #46](https://github.com/yribeiro/pitchkit/pull/46), part of
[issue #40](https://github.com/yribeiro/pitchkit/issues/40).)

**Why:** No model has PitchKit in its training data. A skill versioned with the installed
package moves with `npm update`, so it can't describe an API the consumer doesn't have.

**Consequences:** `packages/react/src/skill-doc.test.ts` asserts the skill's pitch-type table
matches the registry, so adding a pitch type fails CI until `SKILL.md` is updated. That is
intentional.

---

## Data providers

### D13. One `@pitchkit/data-providers` package, one entry point per provider

**Decision:** Loaders live in `@pitchkit/data-providers`, exported per provider
(`/statsbomb`, `/skillcorner`, `/wyscout`).

**Why:** More providers were planned ([#30](https://github.com/yribeiro/pitchkit/issues/30)),
and one package per provider would multiply release overhead.

**Consequences:** The package depends on neither `core` nor `react`. Its only runtime
dependency is `csv-parse`, for SkillCorner's CSV files; that is the project's only
third-party runtime dependency anywhere.

### D14. The provider's data stays the provider's

**Decision:** Loaders keep each provider's own field names and values (StatsBomb's outcome
is `"Off T"`, not a re-spelled `"off-target"`). The only additions are lifted coordinates
(`x`/`y`/`endX`/`endY`, and `pitchX`/`pitchY` for SkillCorner). Interpretation lives in
predicate functions (`isGoal`, `hasTag`), not derived fields.

**Why:** A user can read the provider's own specification alongside the types with no
mapping table, and a predicate can be fixed without changing the data shape.

**Consequences:** Third-party mirrors are acceptable only when they rename nothing. That is
what makes the Wyscout per-match mirror usable (see
[architecture: data provider facts](./architecture.md#data-provider-facts)).

---

## Docs site

### D15. Data gets a top-level docs section

**Decision:** Loader docs live under a top-level **Data** section (`/docs/data`), not under
Configuration. This reverses [issue #29](https://github.com/yribeiro/pitchkit/issues/29)'s
recorded plan to park them there until two or three providers existed.

**Why:** That plan was about volume. The reversal is about positioning: Configuration framed
data loading as one-time setup, when it's a headline capability. Don't restore the old
placement on the strength of the issue text.

### D16. Live data examples load on selection, with no load button

**Decision:** The StatsBomb examples fetch live open data in the browser and load as soon
as a match is selected: events are about 3 MB, and 360 data about 10 MB.

**Why:** 360 originally sat behind a "Load tracking data" button because of its size. That
was dropped, because a click between the page and the chart undercuts the "one call" point
those pages exist to make. Don't reintroduce it as a payload optimisation.

### D17. Styling is one docs section

**Decision:** Theming, Tailwind and Pitch Palettes live under one **Styling** section, above
Data. The Configuration section and the Guides → Recipes page were removed, and their old
URLs redirect in `apps/docs/next.config.ts`.
([PR #74](https://github.com/yribeiro/pitchkit/pull/74).)

**Why:** Styling had been spread across three sections that repeated each other: the
variable table was on two pages, and so was the `@utility` recipe.

### D18. Docs generators run from `next.config.ts`

**Decision:** `next.config.ts` runs both generator scripts (`generate-examples-registry.mjs`
and `generate-api-docs.mjs`) itself via `execFileSync`.

**Why:** The Vercel build broke twice with `ENOENT … registry.ts`. npm `pre*` hooks didn't
run there, and inlining generation into the `build` script didn't help, because Vercel's
Next.js preset runs `next build` directly. `next.config.ts` is the one file Next.js always
loads, whatever invoked it.

**Consequences:** If the ENOENT comes back, check that `next.config.ts` still runs both
scripts. Don't re-chain npm scripts.

### D19. `llms.txt` covers the narrative docs; the API reference is separate

**Decision:** `/llms.txt` and `/llms-full.txt` exclude the ~117 generated API pages, which
are served as `/llms-api.txt`. `<PitchPreview>` tags are replaced with the example's source
in `llms-full.txt`. ([PR #48](https://github.com/yribeiro/pitchkit/pull/48).)

**Why:** A per-symbol reference dump crowds out the pages that teach the library.

**Consequences:** An example shown on a docs page should not import site-only helpers, since
its source is inlined into `llms-full.txt` where an agent may copy it.

### D20. Search title and visible headline say different things

**Decision:** The `<title>` is "PitchKit — React & TypeScript football visualisation library"
(what people search for); the `<h1>` is the brand line "Football visualised for the web.".
The `description` is keyword-bearing, while `og:`/`twitter:` carry the hero copy.

**Why:** Search engines match on the words people type; visitors should see the brand. This
is not drift, so don't make them match.

**Consequences:** `TAGLINE`, `SUBHEAD` and `SEARCH_DESCRIPTION` live in `apps/docs/lib/site.ts`,
read by the hero, the metadata and the OG image. The three had drifted apart once before.
The homepage FAQ renders as both `<details>` and `FAQPage` JSON-LD from one array, so the two
can't disagree. `app/robots.ts` names the AI crawlers explicitly even though the wildcard
already allows them, because `Google-Extended` and `Applebot-Extended` are opt-out tokens
where silence is ambiguous.

### D21. `SITE_URL` is the `www` host

**Decision:** `SITE_URL` is `https://www.pitchkitjs.com`, the host Vercel serves.

**Why:** The apex 308-redirects to `www`. While `SITE_URL` was the apex, every canonical,
sitemap entry and `llms.txt` link pointed at a redirect, which agent crawlers that don't
follow redirects can't use. ([PR #69](https://github.com/yribeiro/pitchkit/pull/69).)

**Consequences:** If the Vercel domain settings ever flip, change `SITE_URL` in the same
commit.

### D22. Two analytics tools, side by side

**Decision:** Vercel Web Analytics and PostHog (`components/posthog-provider.tsx`) are both
wired into `apps/docs/app/layout.tsx`. PostHog was added alongside Vercel, not as a
replacement ([PR #64](https://github.com/yribeiro/pitchkit/pull/64)).

### D24. Charts get a top-level docs section, and the gallery a Timeline category

**Decision:** Non-pitch charts live under a top-level **Charts** section (`/docs/charts`), not
under Overlays. The gallery gains a **Timeline** category, the first whose cards are not drawn on
a pitch.

**Why:** "Overlays" means layered on a pitch, which a race chart is not. Renaming it to cover both
would have moved 13 pages and needed 26 permanent redirects. The section also has known tenants
beyond this chart: radar, pizza and the goal view.

**Consequences:** Nothing moved, so no redirects were needed. A chart card renders on its own
stage (`.pitchkit-chart-stage`), not the pitch's grass: a chart has no pitch. The stage and the chart
tokens follow the site theme, white in light and near-black in dark, in a 3:2 box so the card takes
a pitch card's footprint. The series hues are not the pitch marker hues, which are tuned for grass:
each mode has its own pair, run through the dataviz validator against its own surface (lightness
band, 3:1 contrast, CVD separation above 22), and the yellow card is darkened on white. The same
tokens apply to live previews on the docs pages, which were previously dark-only and unreadable in
light mode. `<RaceChart>` paints no background of its own, so `--pitch-chart-surface` has to be
whatever is actually behind it: the docs theme defaults it to the page stage, and a card that draws
its own stage overrides it alongside the background.
