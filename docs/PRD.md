# ⚽ PRD — PitchKit (mplsoccer for the web)

> **TL;DR** — Build the missing piece of the football-analytics web stack: a TypeScript-native, framework-agnostic visualization library that brings mplsoccer's full surface (pitches, heatmaps, pass networks, radars, pizza charts) to the browser, with first-class React/Next.js bindings, responsive multi-device rendering, great docs, and a shadcn-style showcase site. Personal project, MIT-licensed, built in the open on GitHub.

_Status: Draft v0.4 · Owner: Yohahn Ribeiro · Last updated: 06 Sep 2026_

---

## 1. Summary

Football-analytics visualization on the web has no equivalent to Python's **mplsoccer**. Analysts who want interactive, responsive pitch visualizations in web apps currently stitch together D3 wrappers, half-maintained plugins, or roll their own SVG. This project delivers a single, well-typed, well-documented library that covers mplsoccer's feature set, renders crisply on mobile and desktop, and integrates cleanly with modern React/Next.js apps.

The deliverable is three things: (1) the **library** (a framework-agnostic core + React bindings, published to npm), (2) **documentation** (API reference + guides + live editable examples), and (3) a **showcase website** built in the shadcn/ui design language to demonstrate the library and serve as its marketing front door.

## 2. Background & Problem

**mplsoccer** (by Andrew Rowlinson & Anmol Durgapal) is the de-facto standard for football pitch visualizations in Python — it powers most analyst content on social media, blogs, and academic papers. It draws pitches across nine provider coordinate systems and layers on scatter, arrows, comet lines, heatmaps, hexbins, KDE, flow diagrams, convex hulls, Voronoi, sonars, plus non-pitch charts (radar, pizza/percentile, bumpy) and StatsBomb data loaders. It is, however, **static** (matplotlib → image files) and **Python-only**.

The modern delivery surface for analytics — internal club tools, scouting platforms, fan-facing products — is increasingly the **browser**. There, the gaps are:

- **No TypeScript-native equivalent.** Existing options are thin or unmaintained.
- **No responsive, multi-device story.** mplsoccer outputs fixed-size raster images; web needs fluid, retina-crisp, touch-friendly rendering.
- **No first-class interactivity.** Hover tooltips, selection, animation, and data-driven updates are first-class on the web and absent from a static image pipeline.
- **Fragmented ecosystem.** Pitch drawing, statistical layers, and player charts live in separate, incompatible micro-libraries.

## 3. Competitive Landscape

| Library                       | Lang   | Scope                                           | Render              | Maintained   | Gap vs this project                               |
| ----------------------------- | ------ | ----------------------------------------------- | ------------------- | ------------ | ------------------------------------------------- |
| **mplsoccer**                 | Python | Full (pitch + stats + radar/pizza/bumpy + data) | matplotlib (static) | ✅ Active    | Not web; static; Python-only                      |
| **RabonaJS**                  | JS     | Pitch + event layers (passes)                   | D3/SVG              | Low activity | Narrow; no TS types; no radar/pizza/heatmap depth |
| **d3-soccer**                 | JS     | Pitch + heatmap + SPADL actions                 | D3/SVG              | Stale (~1yr) | D3-coupled; no TS; partial feature set            |
| **football-lineup-generator** | TS     | Lineups/formations only                         | Canvas              | Low activity | No event data, no stats layers                    |
| **Pitch.js**                  | JS     | Pitch rendering                                 | DOM/SVG             | Minimal      | Pitch only, no analytics layer                    |

**Conclusion:** there is a clear, unoccupied niche for a comprehensive, TypeScript-first, framework-agnostic library with a proper React story. Nobody has built "mplsoccer for the web."

## 4. Goals & Non-Goals

### Goals

- **Feature parity (functional, not pixel-perfect) with mplsoccer's core**: pitches across major provider coordinate systems, all primary plotting primitives, statistical layers, and the radar/pizza/bumpy chart family.
- **TypeScript-first**: full, exported types; great editor autocomplete; type-safe data accessors.
- **Framework-agnostic core** with a **thin, idiomatic React binding** and documented Next.js (App Router/SSR) usage.
- **Responsive & multi-device**: fluid resize, retina crispness, touch interactions, sensible defaults from phone to 4K.
- **Interactive**: hover/tooltip, selection, transitions/animation, data-driven updates.
- **Excellent docs**: API reference, conceptual guides, and live editable examples.
- **shadcn-style showcase site** that doubles as documentation home.
- **Open-source, MIT, built in public** with high engineering standards (CI, tests, semver, changelog).
- **Legible to an AI coding agent, not just a human reading docs.** Increasingly, "the
  developer" is a person directing an agent to build a football app in one sitting — which
  raises the bar on API and docs shape rather than adding a separate audience to design for.
  Concretely: a generic `Accessor<T, V>` pattern (§6) means an agent never has to hand-roll a
  data adapter to match a fixed prop shape; every docs example is a complete, standalone,
  copy-pasteable file rather than a fragment assuming surrounding context (already this
  project's `apps/docs` convention, worth stating as a deliberate principle, not an incidental
  format choice); and "load real open data → render a chart" should be a first-class, runnable
  example an agent can lift verbatim, not two separately-documented halves (a data adapter,
  and a chart) it has to wire together itself.

### Non-Goals (v1)

- Not a data-analytics engine (no xG models, no event tagging) — visualization only; consumers bring their own data/metrics.
- Not a charting general-purpose lib — football-specific, not a D3/Plotly replacement.
- No 3D / tracking flythrough in v1 (possible later via WebGL).
- No built-in proprietary data fetching beyond StatsBomb open-data adapters (licensing-safe).
- Not aiming for byte-for-byte matplotlib visual reproduction — web-native aesthetics are fine.

## 5. Target Users & Personas

1. **The analyst-developer** — knows mplsoccer, wants the same expressive power in a React dashboard. Primary persona.
2. **The club/product engineer** — building internal scouting or match-analysis tools; needs reliable, themeable, performant components.
3. **The data journalist / creator** — wants quick, good-looking, shareable interactive viz embedded in articles.
4. **The student / hobbyist** — learning football analytics; needs gentle docs and copy-paste examples.

Note: personas 1–4 increasingly mean "a person directing an AI coding agent to build this,"
not necessarily typing every line by hand — not a fifth persona so much as a lens that applies
across all four. It doesn't change *who* wants the library, but it does raise the bar on *how*
the library and its docs need to be shaped (see the agent-legibility goal in §4).

## 6. Product Principles

- **Coordinates in, pixels out.** Users think in provider coordinates (StatsBomb, Opta, metres); the library owns all scaling/orientation/flipping.
- **Composable layers over monolithic charts.** A pitch is a scene; everything else is a layer drawn onto it. Mirrors mplsoccer's `pitch.draw()` + `pitch.scatter(...)` ergonomics.
- **Sensible defaults, full control.** Looks great with zero config; every visual property overridable and themeable.
- **The core knows nothing about React.** React is one renderer-binding among potentially many.
- **Responsive by construction**, not as an afterthought.
- **Accessible**: semantic where possible, keyboard- and screen-reader-aware, colour-blind-safe default palettes.

## 7. Scope — Feature Inventory

Mapped directly from mplsoccer's modules so parity is auditable. Phase tags: **M** = MVP, **1** = v1.0, **L** = later.

### 7.1 Pitch drawing & geometry

| Feature                                                                                                        | mplsoccer ref                        | Phase                       |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------- |
| Horizontal pitch                                                                                               | `Pitch`                              | M                           |
| Vertical pitch                                                                                                 | `VerticalPitch`                      | M                           |
| Half-pitch / padding / crop                                                                                    | `half`, `pad_*`                      | M                           |
| Pitch types: StatsBomb, Opta, Wyscout, UEFA/metric, Tracab, SkillCorner, SecondSpectrum, MetricaSports, custom | `pitch_type` (9 types)               | M (SB/Opta/UEFA) → 1 (rest) |
| Styling: grass/stripes, line colour/width/alpha, goal types (line/box/circle)                                  | `pitch_color`, `stripe`, `goal_type` | M→1                         |
| Coordinate standardizer (provider→provider)                                                                    | `Standardizer`                       | 1                           |

### 7.2 Plotting primitives (per-event marks)

| Feature                                                   | mplsoccer ref                  | Phase |
| --------------------------------------------------------- | ------------------------------ | ----- |
| Scatter (incl. football marker, rotation, custom markers) | `scatter`                      | M     |
| Arrows / quiver                                           | `arrows`                       | M     |
| Comet lines (tapered, gradient)                           | `lines`                        | M     |
| Annotate / text labels                                    | `annotate`                     | M     |
| Polygon                                                   | `polygon`                      | 1     |
| Convex hull                                               | `convexhull`                   | 1     |
| Voronoi                                                   | `voronoi`                      | 1     |
| Goal angle / shot cone                                    | `goal_angle`                   | 1     |
| Angle & distance helpers                                  | `calculate_angle_and_distance` | 1     |

### 7.3 Statistical / aggregate layers

| Feature                                        | mplsoccer ref                                     | Phase |
| ---------------------------------------------- | ------------------------------------------------- | ----- |
| Heatmap (binned)                               | `bin_statistic` • `heatmap`                       | M     |
| Positional heatmap (Juego de Posición zones)   | `bin_statistic_positional` • `heatmap_positional` | 1     |
| Heatmap labels                                 | `label_heatmap`                                   | 1     |
| Hexbin                                         | `hexbin`                                          | 1     |
| KDE (kernel density)                           | `kdeplot`                                         | 1     |
| Pass/flow diagram (binned direction+magnitude) | `flow`                                            | 1     |
| Sonars / sonar grid                            | `sonar`, `sonar_grid`                             | L     |

### 7.4 Composite recipes (shadcn-registry-distributed, built on primitives)

Pass network, shot map, pass map, pressure heatmap, progressive-pass map, expected-threat grid. Phase **1**.

**Distribution model (resolved — see §13's former open question):** marks (`<Pitch>`,
`<Scatter>`, `<Arrows>`, `<Comet>`, `<Heatmap>`, radar/pizza, etc.) are "plumbing" — coordinate
transforms, SVG/Canvas painting, correctness-critical geometry — published to npm as
`@pitchkit/react`, same as any library dependency; nobody should be hand-maintaining a fork of
arc-sweep math. Recipes are the opposite: the interesting, opinionated decisions (how to bucket
this data, which marks to compose, how to style the result) that a consumer legitimately wants
to own. So recipes ship as **shadcn registry items**, not npm packages or doc-only code blocks:
`npx shadcn add pass-map` copies the actual recipe source (e.g. `PassMap.tsx`) into the
consumer's repo, with `@pitchkit/react` declared as an npm dependency in the registry item's
manifest so it auto-installs underneath — the same split shadcn/ui itself uses (its components
are copied; Radix primitives underneath are npm-installed). This gives users a real starting
point they can restyle or rewire without waiting on an upstream release, while the
correctness-critical rendering stays versioned and centrally maintained.

**"Load open data → visualize" recipes** are a distinct category from the component-level
recipes above, and matter specifically for agent-legibility (§4): a single, complete, minimal
example wiring `@pitchkit/data-statsbomb` straight into a chart — e.g. "fetch a StatsBomb
open-data match → render a shot map" in one file, not a data-loading doc and a charting doc a
consumer (or agent) has to connect themselves. At least one such end-to-end recipe per major
chart family (shot map, pass map, heatmap) ships alongside `@pitchkit/data-statsbomb`. Phase **1**.

### 7.5 Non-pitch charts

| Feature                                                       | mplsoccer ref | Phase |
| ------------------------------------------------------------- | ------------- | ----- |
| Radar chart (with range bands, lower-is-better flip)          | `Radar`       | 1     |
| Pizza / percentile (Nightingale) chart, incl. comparison mode | `PyPizza`     | 1     |
| Bumpy chart (rank-over-time)                                  | `Bumpy`       | L     |

### 7.6 Supporting utilities

| Feature                                                       | mplsoccer ref               | Phase                                           |
| ------------------------------------------------------------- | --------------------------- | ----------------------------------------------- |
| Grid / jointgrid layout (pitch + title + endnote + marginals) | `grid`, `jointgrid`         | 1                                               |
| Inset axes / inset image (e.g. badges, mini-charts on pitch)  | `inset_axes`, `inset_image` | L                                               |
| Font management                                               | `FontManager`               | M (web fonts are trivial; document the pattern) |
| StatsBomb open-data adapter                                   | `Sbopen`                    | 1                                               |
| (Out of scope) authenticated StatsBomb API/local              | `Sbapi`, `Sblocal`          | —                                               |
| Image export (PNG/SVG download) + logo/watermark overlay      | `add_image`                 | 1                                               |

**Why export matters:** every competing analytics tool surveyed treats "download as image" as
table-stakes, not a nice-to-have, and it's the direct mechanism behind this PRD's own
"social-shareable" goal (§5, persona 3) and the docs site's planned visualization gallery (§9)
— without it, a finished chart has no path out of the browser tab it was rendered in. SVG
layers export losslessly as-is; Canvas layers (heatmap/KDE/hexbin) need their
`devicePixelRatio`-scaled backing buffer flattened into the same output. Ship as a core utility
(`exportToPng`/`exportToSvg`) plus a documented recipe, not a component prop — export is a
one-shot imperative action, not part of the declarative render tree.

## 8. Technical Architecture

### 8.1 Rendering strategy — hybrid SVG + Canvas

- **SVG** for pitch geometry and discrete marks (scatter, arrows, lines, annotations, hulls, Voronoi). Rationale: crisp at any DPI, trivially scalable/responsive, DOM-addressable for hover/tooltip/selection/accessibility, SSR-friendly.
- **Canvas (2D, optional WebGL later)** for dense raster layers (heatmaps, KDE, hexbins, and large tracking-frame scatter with thousands of points) where per-element DOM nodes would tank performance.
- A **renderer abstraction** sits behind a single scene/layer API so a layer declares _what_ to draw; the renderer decides SVG vs Canvas. This keeps the public API identical regardless of backend and leaves room for a pure-Canvas or WebGL renderer later.

> **Decision to ratify:** SVG-first wins on interactivity, accessibility, and SSR; Canvas handles the heavy raster cases. Recommendation: **hybrid, SVG-primary.**

### 8.2 Coordinate system & pitch-type abstraction

The heart of the library. A `PitchDimensions` model encodes, per provider: extent, origin corner, y-axis direction (inverted or not), vertical/horizontal orientation, and whether coordinates are normalized. All user data is expressed in provider coordinates; an internal **scale + transform pipeline** maps to pixel space given the current container size, orientation, and crop. This single source of truth guarantees every layer aligns and resizes together.

### 8.3 Scene / layer model

```
Pitch (scene)
 ├─ dimensions (provider coordinate model)
 ├─ viewport  (size, orientation, crop, responsive behaviour)
 └─ layers:   [ Scatter, Arrows, CometLines, Heatmap, KDE, Hull, ... ]
```

Layers are pure data + options; they don't own DOM. The renderer walks the scene and paints. This makes the scene serialisable, testable, and renderer-independent.

### 8.4 Package structure (pnpm + Turborepo monorepo)

- `@pitchkit/core` — zero-dependency TS core: dimensions, transforms, scene/layer model, geometry, SVG/Canvas renderers. **No React.**
- `@pitchkit/react` — thin declarative React components wrapping core (`<Pitch>`, `<Scatter>`, `<Heatmap>` …) with hooks for responsive sizing and interaction.
- `@pitchkit/data-statsbomb` — optional StatsBomb open-data adapter + tidy types.
- `apps/docs` — the showcase + docs site; also hosts the shadcn `registry.json` that serves recipe items (see §7.4).
- `examples/` — runnable Next.js + Vite examples.

Build with **tsup** (ESM + d.ts). Tree-shakeable, `sideEffects: false`. Publish `@pitchkit/core` and `@pitchkit/react` under the `@pitchkit` npm scope — these are the only npm-published packages; composite recipes are shadcn registry items, not packages (§7.4).

### 8.5 React & Next.js integration

- **Declarative components** mirror the layer model: a `<Pitch type="statsbomb">` parent provides coordinate context; layer children like `<Scatter data={...} x={d => d.x} y={d => d.y} />` draw into it.
- **Imperative escape hatch**: `usePitch()` returns the core scene for advanced control.
- **SSR / RSC**: SVG renders server-side cleanly (static shot maps, OG images, no-JS fallback). Canvas layers are client-only — documented `"use client"` boundary, SSR-safe size strategy (explicit aspect ratio on first paint, `ResizeObserver` refine after hydration) to avoid layout shift.

### 8.6 Responsive & multi-device

**Responsive is the default, not an opt-in prop.** `<Pitch type="statsbomb">` with no size props fills its container via `ResizeObserver` and recomputes on every resize automatically — no `responsive` flag needed. This follows the existing product principle: "sensible defaults, full control."

Explicit sizing is the deliberate opt-out, reserved for cases where a reactive container doesn't make sense:

```typescript
// Default — fills container, reflows on resize, no prop required
<Pitch type="statsbomb" />

// Opt-out — fixed size for export/email/PDF/OG-image use cases
<Pitch type="statsbomb" width={1200} height={800} />
```

When `width`/`height` are omitted, the `ResizeObserver` path is used. When supplied, the pitch renders at that exact size and ignores container resize — the correct behaviour for static exports where there is no reactive container to measure (e.g. server-side PNG generation, social share cards, PDF embedding).

**Touch vs hover — two distinct interaction modes**, detected via `matchMedia('(pointer: coarse)')` rather than touch-event sniffing (which also catches styluses/hybrid devices correctly). Desktop: hover shows a tooltip near the cursor. Touch: tap selects the mark and shows a callout positioned above it (not under the finger); tapping elsewhere deselects.

**Touch target sizing.** Visual marks (e.g. an 8px xG-scaled shot dot) are frequently far smaller than a comfortable tap target. Every interactive layer renders an invisible hit-area at minimum 44×44 CSS px (Apple/Google touch guidance) around the visible mark, regardless of the mark's rendered size — handled inside the layer itself, not something a developer configures.

**`devicePixelRatio`-aware Canvas.** Canvas layers (heatmap, KDE) read `window.devicePixelRatio`, back the canvas at `cssSize × dpr` physical pixels, and scale the drawing context accordingly — otherwise dense layers look soft on retina phones. SVG layers are unaffected (vector, resolution-independent).

**Adaptive density at small sizes.** Below a configurable container-width threshold, label/annotation layers thin out or hide (`hideBelow` prop), stroke widths reduce, and marker-size scaling adjusts — so a pass network doesn't become unreadable noise on a 390px viewport.

**Touch-scroll conflict.** The pitch root sets `touch-action: pan-y` by default so a vertical swipe over the pitch still scrolls the page rather than getting captured as a chart gesture; this becomes `touch-action: none` automatically if/when pinch-to-zoom ships (Milestone 3).

**Container-query-friendly**; works inside flex/grid dashboards without extra configuration.

### 8.7 Theming & styling

The theming model is **CSS variables only** — the same mechanism shadcn uses internally. No typed theme objects, no JS providers. Users define tokens once in `globals.css` and every chart in their app inherits them automatically, including dark mode.

**How it works — three layers:**

**Layer 1 — CSS variables as the source of truth,** dropped into `globals.css` on install:

```css
:root {
  --pitch-surface: #1a472a;
  --pitch-stripe: #1d4f30;
  --pitch-lines: rgba(255, 255, 255, 0.8);
  --pitch-marker-primary: #3b82f6;
  --pitch-marker-goal: #f59e0b;
  --pitch-marker-miss: rgba(255, 255, 255, 0.4);
}

.dark {
  --pitch-surface: #0f2819;
  --pitch-lines: rgba(255, 255, 255, 0.6);
}
```

**Layer 2 — Tailwind.** Resolved by [issue #7](https://github.com/yribeiro/pitchkit/issues/7)
(see Milestone 1 progress notes and Appendix C.6 for the full writeup); superseded the
`@theme inline` per-token-mapping sketch this section originally had, because marks and the
pitch background need genuinely different mechanisms:

- **Marks you render yourself** (`<Scatter>`/`<Arrows>`/`<Comet>`/`<Annotate>`) take a
  `className` prop, forwarded straight onto the SVG element(s). The one non-obvious part: a
  mark's themed default colour (e.g. `fill: var(--pitch-marker-primary)`) is applied as an
  inline `style`, and inline style always wins over a class at the same CSS property — so a
  mark only omits that default, letting a `fill-*`/`stroke-*` utility take effect, when
  `className` is set _and_ the corresponding accessor prop (`fill`/`stroke`/`color`) is
  absent. Pass an explicit accessor prop and it still always wins over `className`, same as
  before.
- **Marks you don't own the JSX for** (e.g. inside a future shadcn recipe wrapping
  `<Pitch>`) fall back to the `data-pitchkit-mark`/`data-pitchkit-layer`/`data-pitchkit-part`
  attributes every element already carries, via Tailwind's arbitrary-variant selectors —
  `className="[&_[data-pitchkit-mark=scatter]]:fill-cyan-400!"` on a wrapping element. The
  trailing `!` (Tailwind v4's important modifier) is required here specifically because those
  marks never got a `className`, so nothing signalled them to back off their inline default.
- **The pitch background** (outline/stripes/lines — `PitchGeometryShapes`, not a mark) is
  deliberately restyled only via the `--pitch-*` CSS variables, never via `className` on the
  shapes directly (see `core/theme/part-style.ts`'s doc comment). Two ways to set those
  variables with Tailwind: the zero-setup arbitrary-property syntax
  (`className="[--pitch-surface:var(--color-emerald-800)]"`), or an installable `@utility`
  recipe — `pitch-surface-*`/`pitch-stripe-*`/`pitch-lines-*` via
  `--value(--color-*)` — that turns the variables into first-class utilities reading any
  colour already in the project's Tailwind theme. `--pitch-line-width` (stroke width,
  default `1.5`) gets the same recipe shape, but validates a bare/arbitrary number
  (`--value(number, [number])`) instead, since Tailwind has no rich preset colour-style scale
  for stroke width to borrow from.

**Layer 3 — Canvas reads the same vars at draw time:**

```typescript
const surface = getComputedStyle(containerEl).getPropertyValue("--pitch-surface").trim();
ctx.fillStyle = surface;
```

One token. Both renderers. No duplication.

**Dark mode is free.** `.dark { --pitch-surface: #0f2819 }` is the entirety of the change — no props, no re-renders. PitchKit doesn't need to know dark mode exists.

**Per-chart overrides via CSS cascade.** Wrap any chart in a `<div>` with scoped inline variable overrides — no theme prop, no provider:

```typescript
<div style={{ '--pitch-surface': '#fff', '--pitch-lines': '#222' } as React.CSSProperties}>
  <ShotMap shots={shots} />
</div>
```

**Data-driven colour — accessors.** For colour derived from a datum (marker fill = outcome, opacity = xG), layer props accept accessor functions returning any valid CSS colour string, including variable references:

```typescript
fill={d => d.shot.outcome.name === 'Goal'
  ? 'var(--pitch-marker-goal)'
  : 'var(--pitch-marker-miss)'}
```

**Resolution order per visual property:** accessor prop → explicit static prop → `className`
utility (only if no accessor/static prop given) → CSS variable default → library built-in.

**Token discoverability — the only TS in the theming layer:**

```typescript
export const pitchTokens = {
  surface: "--pitch-surface",
  stripe: "--pitch-stripe",
  lines: "--pitch-lines",
  lineWidth: "--pitch-line-width",
  markerPrimary: "--pitch-marker-primary",
  markerGoal: "--pitch-marker-goal",
  markerMiss: "--pitch-marker-miss",
} as const;
```

This exists purely for editor autocomplete. The values live in CSS.

**Theme presets via shadcn registry.** Built-in presets (classic grass, dark broadcast, print/white, colour-blind-safe) ship as registry items — CSS variable bundles installable in one command:

```bash
npx shadcn add @pitchkit/theme-broadcast
```

### 8.8 Accessibility

- SVG marks carry `role`/`aria-label`; pitch exposes an accessible description.
- Keyboard navigation across discrete marks; focus-visible states.
- Respect `prefers-reduced-motion` for transitions.
- Minimum contrast in default themes; never colour-only encoding without shape/label backup in recipes.
- **Default colour scale is colour-blind-safe, not just the swappable theme preset.** The
  `colour-blind-safe` registry preset (§8.7) covers the pitch/marker CSS variables, but
  `createColorScale`'s `colorMin`/`colorMax` (heatmap/hexbin/KDE) are per-instance string
  props, outside that CSS-variable path — so `<Heatmap>` and friends need their own built-in
  default pulled from a validated colour-blind-safe pair (e.g. the Wong 8-colour palette's
  blue→orange, distinguishable across protanopia/deuteranopia/tritanopia), not an arbitrary
  green→red gradient, unless a consumer explicitly overrides it.
- **Data table fallback for dense layers.** Heatmap/hexbin/KDE convey their underlying values
  visually only; ship an optional pattern (documented recipe, not a required prop) for pairing
  a density layer with a visually-hidden-but-screen-reader-exposed data table of the same
  binned values, per current data-viz accessibility guidance.

### 8.9 Performance budgets

- 60fps interaction on a mid-range phone for a typical match event layer (~1–3k marks) via SVG; switch to Canvas above a configurable threshold.
- Tracking-data scatter (10Hz frames, thousands of points) → Canvas/WebGL path.
- Lazy/code-split heavy layers (KDE, Voronoi) so a simple shot map ships minimal JS.
- Benchmark harness in CI tracking render time + bundle size per package.

### 8.10 Data adapters & coordinate safety

- `@pitchkit/data-statsbomb`: typed loaders for StatsBomb open-data (events/frames) → tidy shapes, coordinate model pre-wired. Free open-data only (licensing-safe).
- Generic accessor pattern (`x={d => d.location[0]}`) so any provider shape works without an adapter.

## 9. Documentation & Showcase Site

**Design language:** shadcn/ui aesthetic — clean, token-driven, dark/light, Radix primitives, Tailwind. **Next.js (App Router)** + Fumadocs or Nextra so MDX + live code blocks are first-class.

**Must-haves:**

- Landing page with an immediate, interactive hero pitch (responsive demo you can touch).
- **Live examples** (rendered output + copy-ready code + "Open in StackBlitz/CodeSandbox") for every feature — the single biggest adoption driver. (Amended per issue #28: shadcn/ui's own reference implementation is copy-only; true in-browser editing (Sandpack/react-live) is a later enhancement if still wanted.)
- Full **API reference** (generated from TSDoc via TypeDoc/api-extractor, styled to match).
- **Conceptual guides**: coordinates & pitch types, layers, theming, responsive, Next.js/SSR, recipes (pass network, shot map, radar).
- "mplsoccer → PitchKit" **migration/cheatsheet** page to capture that audience directly.
- Copy-paste install + quickstart; CodeSandbox/StackBlitz "open in" buttons.
- Gallery of finished visualizations (social-shareable).

## 10. Engineering Standards & Tooling

- **Language/build:** TypeScript (strict), tsup, pnpm, Turborepo.
- **Testing:** Vitest (unit: transforms, dimensions, geometry); Playwright + visual snapshots for rendered output; jsdom/happy-dom for component tests.
- **Quality:** ESLint + Prettier (or Biome), typecheck in CI, size-limit budgets, coverage on the coordinate/transform core.
- **CI/CD:** GitHub Actions — lint, typecheck, test, visual-regression, build, bundle-size report on PRs.
- **Release:** Changesets for semver + automated changelog + npm publish; canary tags from main.
- **Docs deploy:** Vercel.
- **Repo hygiene:** clear README with hero GIF, CONTRIBUTING, issue/PR templates, good-first-issues, MIT licence.

## 11. Roadmap (phased)

### Milestone 0 — Foundations ✅ Complete

- [x] Monorepo scaffold (npm workspaces/Turborepo/tsup), CI, lint/test baseline.
- [x] Coordinate model + transform pipeline + `Standardizer` core, fully unit-tested.
- [x] SVG renderer + scene/layer architecture.

### Milestone 1 — MVP (core pitch + primitives) 🚧 In progress

- [x] Pitch styling: CSS-variable-themed defaults (`--pitch-surface`, `--pitch-stripe`,
      `--pitch-lines`) with built-in fallbacks, optional grass stripes and box-style goal
      frames via `PitchAppearance`, `cropForHalf()` convenience, `pitchTokens` for
      autocomplete. (Orientation, padding, and crop were already in the M0 transform
      pipeline; StatsBomb/Opta/UEFA dimensions already in M0. No separate `VerticalPitch`
      component exists yet — that's a `@pitchkit/react` API concern, not core.)
- [x] Scatter, Annotate, Arrows, Comet lines — SVG mark layers on the new `Layer`
      discriminated union, with `Accessor<T, V>` (static value or per-datum function) for
      every visual prop, resolved via `scene/resolve.ts`.
- [x] Binned Heatmap (Canvas path): `HeatmapLayer` (count, or a summed `weight` accessor),
      pure `computeHeatmapBins`, a hand-rolled zero-dependency `createColorScale`, and
      `renderHeatmapLayersToCanvas` / `canvasRenderer` — the second concrete
      `Renderer<TOutput>` implementation alongside `svgRenderer`, with `devicePixelRatio`
      handling per §8.6. Core deliberately does not solve SVG+Canvas compositing (stacking
      the two elements in the DOM is a consumer/`@pitchkit/react` concern) —
      `packages/core/examples/index.html` hand-wires a stacked demo panel to prove it's
      possible. Every `@pitchkit/core` item in Milestone 1 is now done.
- [x] `@pitchkit/react` bindings + responsive sizing + tooltips: `<Pitch>`/`<VerticalPitch>`
      (responsive by default via `ResizeObserver`, explicit `width`/`height` is the opt-out,
      SSR-safe aspect-ratio fallback before the first measurement per §8.6), `<Scatter>`/
      `<Annotate>`/`<Arrows>`/`<Comet>` (JSX mark emission with hover tooltips), `<Heatmap>`
      (client-only `<canvas>` via `<foreignObject>`), and `usePitch()`. Components re-emit
      SVG as JSX rather than reusing core's DOM painters — the only way to get
      `renderToString`-able output (verified by a dedicated SSR test suite) — while sharing
      100% of core's math (transform, geometry, arc/arrow/comet geometry, styling) so the
      two renderers can't drift on anything but element-emission syntax. Review harness:
      `examples/react-vite/`, `examples/react-nextjs/` (App Router SSR verification).
- [x] Docs site skeleton with live examples for the above. (Delivered by
      [issue #17](https://github.com/yribeiro/pitchkit/issues/17) /
      [PR #18](https://github.com/yribeiro/pitchkit/pull/18): `apps/docs`, Next.js App
      Router + Fumadocs + Tailwind v4, `<PitchPreview>` registry pipeline.)
- [x] shadcn-style showcase website (doubles as docs home, per §9). (Delivered by
      [issue #28](https://github.com/yribeiro/pitchkit/issues/28): interactive landing
      hero, category-tabbed `/gallery` with View Code + StackBlitz/CodeSandbox export,
      TypeDoc-generated API reference styled by Fumadocs, conceptual guides, and the
      mplsoccer → PitchKit migration cheatsheet. Note: the "open in sandbox" buttons
      build a correct Vite project but can't resolve `@pitchkit/*` until Milestone 3
      publishes to npm.)
- [x] [Issue #6](https://github.com/yribeiro/pitchkit/issues/6): resolved — decision:
      **deprecate/reposition the SVG painters as internal-only.** `render/svg/paint-*.ts`,
      `render-scene.ts`, `svgRenderer`, and the `Renderer<TOutput>` abstraction (for SVG
      specifically — `canvasRenderer` for heatmaps is unaffected, since `@pitchkit/react`'s
      `<Heatmap>` still calls into it directly) are internal building blocks kept only to
      support the `packages/core/examples/index.html` dev harness, not a supported public
      consumption path. `@pitchkit/react` is the only officially supported rendering surface
      going forward. Consequence for Milestone 2: new mark types (hexbin, KDE, flow, polygon,
      convex hull, Voronoi, goal angle) ship **React-only** — no DOM painter is written for
      them, avoiding the double-implementation cost the issue flagged. `@internal` JSDoc added
      at the three export sites (`render/renderer.ts`, `render/svg/render-scene.ts`,
      `index.ts`) and `examples/index.html` relabelled as an internal dev harness rather than
      a reference implementation, so nobody mistakes it for a supported vanilla-JS pattern.
- [x] [Issue #7](https://github.com/yribeiro/pitchkit/issues/7): resolved — Tailwind
      integrates via four mechanisms rather than one (see §8.7 and Appendix C.6 for the full
      writeup): (1) `className` on `<Scatter>`/`<Arrows>`/`<Comet>` (`<Annotate>` already had
      it), which now back off their themed default `fill`/`stroke` when `className` is set
      and no explicit colour prop is given — inline style otherwise always beats a class,
      which the original issue didn't anticipate; (2) the existing
      `data-pitchkit-mark`/`-layer`/`-part` attributes as the escape hatch for marks whose
      JSX you don't own, via Tailwind arbitrary-variant selectors with the `!` important
      modifier; (3) a `pitch-surface-*`/`pitch-stripe-*`/`pitch-lines-*` `@utility` recipe
      (`--value(--color-*)`) for the pitch background, which isn't a mark and was never in
      scope for `className`; (4) `pitch-line-width-*` (bare/arbitrary number — no colour-style
      palette to borrow from). Implemented and manually verified end-to-end in
      `examples/react-nextjs/` (`TailwindPanel.tsx` + `globals.css`); merged via
      [PR #13](https://github.com/yribeiro/pitchkit/pull/13).

**Progress notes for the next agent (as of 2026-06-30):**

- Pitch styling/theming and the SVG mark layers landed via branch
  `milestone-1-pitch-styling-layers`, [PR #3](https://github.com/yribeiro/pitchkit/pull/3)
  (merged into `main`).
- The Canvas heatmap landed via branch `milestone-1-canvas-heatmap`,
  [PR #4](https://github.com/yribeiro/pitchkit/pull/4) (merged into `main`).
- `@pitchkit/react` landed via branch `milestone-1-react-bindings`,
  [PR #5](https://github.com/yribeiro/pitchkit/pull/5) (open, not yet merged into `main`).
- Manually verified via `packages/core/examples/index.html` (styling control panel + a
  stacked SVG+Canvas heatmap panel) and the new `examples/react-vite/` app (responsive
  Pitch+Scatter+Arrows+tooltip panel, fixed-size Pitch+Heatmap panel). Serve `core/examples`
  with `npm run build` in `packages/core` then a static server from the `packages/core`
  directory (not `examples/`, since the page imports `../dist/index.js`); serve
  `react-vite` with `npm run dev` from `examples/react-vite` after building
  `packages/core`+`packages/react`. Both wired into the checked-in `.claude/launch.json`
  (`core-examples` port 4321, `react-vite-example` port 5173).
- **Shared-math extraction pattern (important if you touch pitch/mark rendering):** every
  piece of core's SVG-painter _logic_ that `@pitchkit/react` also needs got pulled out of
  `render/svg/paint-*.ts` into pure, exported functions before the React side was written —
  `theme/part-style.ts` (`partStyle`), `scene/appearance.ts` (stripe bands, goal-box
  geometry), `render/arc-sweep.ts` (sweep-flag + path-string math), `render/arrow-geometry.ts`,
  `render/comet-geometry.ts`. If you add a new SVG mark type or change pitch-appearance
  math, extract the logic the same way rather than letting `@pitchkit/react` reimplement it
  independently — that's the whole point of the exercise (see the comment on
  `pitch-geometry.tsx` in `@pitchkit/react`).
- `core`'s `partStyle()` returns a CSS string (for `setAttribute("style", ...)`); React's
  `style` prop needs a camelCase object. `packages/react/src/style-string.ts` bridges this —
  don't change `partStyle`'s string format for React's sake, add to the bridge instead.
- **turbo.json gotcha (caught by CI, not local testing):** `@pitchkit/react` resolves
  `@pitchkit/core` via its published `exports` field, which only points at
  `dist/index.d.ts` — there's no path back to source types. `typecheck` didn't depend on
  `^build` (a leftover from M0, when there were no cross-package dependencies to worry
  about), so on a genuinely fresh checkout `@pitchkit/react`'s typecheck ran before
  `@pitchkit/core` had ever been built and failed with `Cannot find module '@pitchkit/core'`.
  This passed locally throughout development purely because `packages/core/dist` already
  existed from earlier manual builds in the session, masking the missing task dependency.
  Fixed by adding `"dependsOn": ["^build"]` to `turbo.json`'s `typecheck` task (`test` didn't
  need the same fix — `packages/react/vitest.config.ts` aliases `@pitchkit/core` straight to
  its source `.ts`, bypassing `exports` entirely for tests). If you add a fourth package that
  imports another workspace package's types, verify the relevant task's turbo dependency
  from a clean `rm -rf packages/*/dist .turbo`, not just from a session with pre-existing
  builds lying around.
- `Layer` is erased to `any` rather than `unknown` in `scene/types.ts` — deliberate.
  TypeScript's `strictFunctionTypes` makes `ScatterLayer<T>`/etc. invariant in `T` because
  of the accessor function parameter, so a concrete `ScatterLayer<MyDatum>` can never widen
  to `ScatterLayer<unknown>` for storage in the heterogeneous `layers` array. See the
  comment on `Layer` before changing this.
- Canvas painting is tested via a hand-rolled mock of `CanvasRenderingContext2D` (see
  `render/canvas/paint-heatmap.test.ts` and `render-heatmap.test.ts` in core, and
  `Heatmap.test.tsx` in react), not real pixel output — happy-dom's `<canvas>` has no real
  2D rendering support, so `canvas.getContext("2d")` returns `null` under test.
  `render-heatmap.test.ts`/`Heatmap.test.tsx` stub `HTMLCanvasElement.prototype.getContext`
  via `vi.spyOn` for the tests that need to observe paint calls.
- **tsup + `"use client"` gotcha:** `tsup`'s `banner: { js: '"use client";' }` option
  produces an ESM bundle with no directive at all — esbuild silently drops banner text that
  looks like a directive prologue (only a build-log warning, no error). `@pitchkit/react`'s
  fix is `packages/react/scripts/add-use-client.mjs`, a postbuild step that prepends the
  directive to `dist/index.js` as a plain text operation after bundling finishes. If you add
  a package that needs `"use client"`, copy this pattern, not `tsup`'s `banner` option.
- **Vite + workspace package rebuild gotcha:** if you rebuild `packages/react` (or `core`)
  while a Vite dev server for `examples/react-vite` is already running, Vite's dependency
  pre-bundling cache can serve the stale version and HMR silently fails to pick up the
  change (`[vite] Failed to reload ...dist/index.js`). Clear
  `examples/react-vite/node_modules/.vite` and restart the dev server rather than relying
  on HMR when iterating across the workspace boundary this way.
- **Testing hover tooltips:** `fireEvent.mouseEnter`/`mouseLeave` from
  `@testing-library/react` correctly trigger React's synthetic `onMouseEnter`/`onMouseLeave`
  handlers in unit tests. A raw `element.dispatchEvent(new MouseEvent("mouseenter"))` does
  **not** reliably work — use `fireEvent`. Separately, simulating hover via a live
  browser's CDP-driven mouse-move (e.g. an agent's browser-automation `hover` action) also
  did not reliably trigger it in manual verification — this is a known category of
  automation quirk (synthetic pointer events not matching the boundary-crossing sequence
  React listens for), not a bug in the tooltip implementation; trust the `fireEvent`-based
  unit tests over live-browser hover simulation for this specific interaction.
- **Environment quirk:** this repo's `node_modules` were installed under WSL (Linux
  optional deps, e.g. `@rollup/rollup-linux-x64-gnu`), but the default shell tool resolves
  to Windows `node.exe` via a UNC path, which fails on `vitest`/`tsup` (missing the Linux
  rollup binary) and on plain `npm run <script>` (cmd.exe rejects UNC working directories).
  Run all `npm`/`node` commands through real WSL instead, e.g.
  `wsl.exe -e bash -lic "cd ~/random/pitchkit/packages/core && npm run test"` (the `-lic`
  flags matter — login+interactive loads `nvm`). `git`/`gh` work fine from the default
  shell tool. Also: this WSL install has an `nvm` `default` alias pinned to an old Node
  22.4.0 that doesn't satisfy some deps' `engines` field — run `nvm alias default 22.23.1`
  (or whatever the newest installed 22.x is) once if you see `EBADENGINE` warnings on
  install.
- **`examples/react-nextjs/`** (Next.js 16, App Router) added to verify `@pitchkit/react`'s
  SSR story under a real Next.js server, not just `renderToString` in a test. Real finding
  from building it: every `@pitchkit/react` layer takes accessor _functions_ as props
  (`x={(p) => p.x}`), and React Server Components cannot pass functions as props to a Client
  Component — `next build` failed with "Functions cannot be passed directly to Client
  Components" when the `<Pitch>` tree lived directly in the page's Server Component. Fix:
  the `<Pitch>` tree must _originate_ inside a `"use client"` component (see
  `app/LineupPanel.tsx`, `app/HeatmapPanel.tsx`) rather than being composed from a Server
  Component parent — `"use client"` only governs hydration and the prop-serialization
  boundary, not whether SSR happens, so the initial HTML is still fully server-rendered
  (confirmed via `fetch("/")` returning real `<svg>`/`data-pitchkit-mark="scatter"` markup,
  and via `next build`'s static prerender succeeding). Wired into `.claude/launch.json` as
  `react-nextjs-example`, port 3000 (`npm run dev -- --hostname 0.0.0.0` from
  `examples/react-nextjs`).
- **Issue #7 (Tailwind integration), resolved 2026-09-06, merged via
  [PR #13](https://github.com/yribeiro/pitchkit/pull/13).** Core finding, worth knowing
  before touching any mark's styling again: `<Scatter>`/`<Arrows>`/`<Comet>` always applied
  their themed default `fill`/`stroke` as an inline `style`, even when the corresponding
  accessor prop was never passed — and inline style unconditionally beats a CSS class at the
  same property, so simply adding a `className` prop (the issue's naive framing) would have
  done nothing for colour. Fix: `fill`/`stroke`/`color` now resolve to `undefined` (omitted
  from `style` entirely) when `className` is set _and_ the accessor prop is absent, letting a
  Tailwind class apply; an explicit accessor prop still always wins over `className`, same as
  before. `<Annotate>` already had `className` (and didn't have this bug, since it has no
  themed default colour to conflict with) — that's the pattern the fix generalises to the
  other three. Changes: `core/scene/types.ts` (`className?: string` added to
  `ScatterLayer`/`ArrowsLayer`/`CometLayer`), the three `render/svg/paint-*.ts` painters
  (forward `className` as the `class` attribute — vanilla-DOM consumers get this too, not
  just React), and `react/{Scatter,Arrows,Comet}.tsx` (forward `className` + the
  default-backoff logic). `Arrows` applies one `className` to both the shaft and the head
  (single visual unit, one class). Test coverage added at both layers mirroring `Annotate`'s
  existing pattern, plus new tests specifically locking in the backoff behaviour (e.g.
  `Scatter.test.tsx`'s "omits the themed default fill/stroke inline style when className is
  set without fill/stroke" case) — 213 tests passing, core still at 100% coverage. Second,
  independent mechanism (not a code change): every element already carries
  `data-pitchkit-mark`/`data-pitchkit-layer`/`data-pitchkit-part`, usable via Tailwind
  arbitrary-variant selectors for marks whose JSX isn't yours to edit — this needs the `!`
  important modifier, since those marks never got a `className` to signal the backoff. Third
  and fourth mechanisms are pitch-background theming, not marks at all — see §8.7. All four
  demonstrated together in a new `examples/react-nextjs/app/TailwindPanel.tsx`, added
  alongside wiring Tailwind v4 into that example for the first time (`postcss.config.mjs`,
  `@import "tailwindcss"` in `globals.css`, `@utility` recipe block) — confirmed coexisting
  cleanly with the example's existing plain CSS and `--pitch-*` `:root` theme, and confirmed
  live via `next build` + the dev server, not just unit tests. One environment-specific
  gotcha hit while building this: after rebuilding `@pitchkit/core`/`@pitchkit/react` (`tsup`)
  mid-session, the Next.js dev server kept serving the stale `dist/` output through its own
  bundler cache — a plain page reload wasn't enough; restarting the dev server (`preview_stop`
  + `preview_start`) was required to pick up the rebuilt workspace packages, same category of
  issue as the Vite pre-bundling gotcha already documented above.
- Docs site skeleton ([PR #18](https://github.com/yribeiro/pitchkit/pull/18)) and the
  shadcn showcase website ([PR #32](https://github.com/yribeiro/pitchkit/pull/32)) are both
  merged, closing out Milestone 1 entirely as of 2026-09-06. Publishing (npm publish, repo
  hygiene, Changesets, deploying the docs site) remains deferred to a new
  **Milestone 3 — publishing**, run as one concentrated effort after Milestone 2's parity
  push, so the site only needs to be built/updated twice (once for M1, once for M2) rather
  than being kept publish-ready throughout.
- Milestone 2 already has a head start: geometric overlays (Flow, Polygon, Convex Hull,
  Voronoi, Goal Angle) shipped via [PR #25](https://github.com/yribeiro/pitchkit/pull/25),
  and a pitch-outline stroke/fill rendering bug was fixed via
  [PR #31](https://github.com/yribeiro/pitchkit/pull/31).

### Milestone 2 — v1.0 (parity push)

- [ ] Remaining pitch types + Standardizer exposed.
- [ ] Positional heatmap, hexbin, KDE ([issue #19](https://github.com/yribeiro/pitchkit/issues/19)).
- [x] Flow, polygon, convex hull, Voronoi, goal angle
      ([PR #25](https://github.com/yribeiro/pitchkit/pull/25)).
- [ ] Radar + Pizza charts.
- [ ] StatsBomb open-data adapter.
- [ ] Grid/jointgrid layout; shadcn registry infrastructure (`registry.json` served from
      `apps/docs`) + first recipe items (pass network, shot map) per §7.4.
- [ ] Full API reference; migration cheatsheet; gallery.
- [ ] Update the docs site / showcase website with all of the above.

### Milestone 3 — publishing (concentrated effort)

**Largely complete as of 2026-09-08** — the library is public, installable, and documented at
a real domain. Remaining work is release *automation*, not release itself.

- [x] First npm publish — [`@pitchkit/core@0.1.0`](https://www.npmjs.com/package/@pitchkit/core)
      and [`@pitchkit/react@0.1.0`](https://www.npmjs.com/package/@pitchkit/react), published
      2026-09-08 under the `pitchkit` npm org. Verified end-to-end from a clean StackBlitz
      project installing straight from the registry.
- [x] Repo hygiene: MIT `LICENSE` (root + both packages), root README with badges,
      per-package READMEs for the npm pages, `CONTRIBUTING.md`, issue/PR templates, and
      `repository`/`homepage`/`bugs`/`keywords` metadata. Still open: labelling
      good-first-issues.
- [ ] Changesets wired for semver + automated changelog; canary tags from `main`.
      **Partially done** — Changesets drives versioning/changelogs locally, and
      `.github/workflows/release.yml` exists, but it is currently `disabled_manually` (it
      failed with `ENEEDAUTH`; no `NPM_TOKEN` was ever configured). The `0.1.0` release was
      published manually. Tracked in
      [issue #36](https://github.com/yribeiro/pitchkit/issues/36) — preferred fix is npm
      Trusted Publishing (OIDC), which avoids storing a publish token and adds provenance
      attestation.
- [x] Docs site deployed at a real domain — **[pitchkitjs.com](https://pitchkitjs.com)**
      (landing page with interactive hero, `/gallery`, docs, API reference).
- [x] Naming finalised (§14) — `@pitchkit` npm scope claimed via the `pitchkit` org;
      GitHub repo is `yribeiro/pitchkit`.

**Known issue visible on the live site:** the hero's Opta tab renders a square pitch rather
than a 105×68 rectangle ([issue #2](https://github.com/yribeiro/pitchkit/issues/2)) —
measured at aspect ratio 1.0 versus 1.5 for StatsBomb and 1.544 for UEFA. Root cause is
narrower than the issue currently records: `PitchDimensions` already carries `normalized`,
`realLengthMeters` and `realWidthMeters`, but **nothing in the codebase reads those three
fields** — the transform derives its aspect from `length`/`width` directly. That is correct
for StatsBomb (120×80) and UEFA (105×68 metres), and wrong for Opta, whose grid is a
normalized 100×100. Fix: when `normalized` is true, derive the display aspect from the real-metre
fields.

### Milestone 4 — later

- [ ] Sonars, bumpy chart, inset images.
- [ ] WebGL renderer for tracking-scale data; animation/timeline helpers — frame-by-frame
      playback with a scrubber, not just a fast static render. Free tracking-data sources now
      exist to build/test against without a commercial licence: SkillCorner's open broadcast
      tracking data, Metrica Sports' sample tracking+event data (CSV/EPTS/JSON).
- [ ] Optional Vue/Svelte bindings (core already supports it).

## 12. Success Metrics

- **Adoption:** npm weekly downloads; GitHub stars; dependent repos.
- **DX quality:** time-to-first-pitch in quickstart < 5 min; issues tagged "confused" trending down.
- **Coverage:** ≥ 90% of phase-1 mplsoccer feature inventory shipped at v1.0.
- **Performance:** meets per-layer render + bundle budgets in CI.
- **Docs engagement:** example interactions; migration-page traffic.
- **Personal:** a portfolio-grade, public artifact demonstrating platform/library design.

## 13. Risks & Open Questions

- **Scope creep** — mplsoccer is large. Mitigation: strict phase gates; recipes over rigid components.
- **Rendering decision lock-in** — ratify SVG-first hybrid early; keep the renderer abstraction clean so it's reversible.
- **SSR + Canvas friction** — design the client boundary deliberately; provide SSR-safe SVG fallbacks.
- **Maintenance burden (solo)** — keep the core small and well-tested; lean on Changesets/CI; design for contributor on-ramp.
- **Open question:** Selective D3 modules (d3-scale, d3-delaunay, d3-contour) vs hand-rolled for hard geometry? Leaning selective/tree-shakeable D3 for maths, custom for rendering.
- **Resolved:** Ship composite charts (pass network, shot map, …) as components or documented recipes only? — **Recipes, distributed as shadcn registry items** (copied source, `@pitchkit/react` as an auto-installed dependency), not npm packages and not doc-only code blocks. See §7.4 for the full writeup.

## 14. Naming

**Settled: PitchKit.** The `@pitchkit` npm scope is claimed (via the `pitchkit` org), the repo is `yribeiro/pitchkit`, and the docs site is live at [pitchkitjs.com](https://pitchkitjs.com). The shortlist considered and rejected: _Pitchwright, Touchline, Chalkboard, Footwork, Tifo_. Criteria were: short, npm-scope-friendly, not trademark-conflicting, evokes football + toolkit.

---

## Appendix A — mplsoccer reference (parity audit)

**Modules:** `pitch` (`Pitch`, `VerticalPitch`), `radar_chart` (`Radar`), `py_pizza` (`PyPizza`), `bumpy_chart` (`Bumpy`), `statsbomb` (`Sbopen`/`Sbapi`/`Sblocal`), `quiver` (`arrows`), `linecollection` (`lines`), `utils` (`FontManager`, `add_image`, `inset_axes`, `inset_image`, `set_labels`, `get_aspect`, `grid`).

**Pitch plotting methods:** `draw`, `grid`, `jointgrid`, `scatter`, `arrows`, `lines`, `annotate`, `polygon`, `convexhull`, `voronoi`, `goal_angle`, `bin_statistic` + `heatmap`, `bin_statistic_positional` + `heatmap_positional`, `label_heatmap`, `hexbin`, `kdeplot`, `flow`, `sonar` / `sonar_grid`, `inset_axes`, `inset_image`, `calculate_angle_and_distance`, `Standardizer`.

**Pitch types (9):** statsbomb, opta, tracab, wyscout, metricasports, uefa (105×68 m), skillcorner, secondspectrum, custom.

**Non-pitch charts:** Radar (range bands, lower-is-better flip), PyPizza (percentile/Nightingale, comparison mode), Bumpy (rank-over-time).

Licence: MIT.

## Appendix B — References

- mplsoccer docs: https://mplsoccer.readthedocs.io
- mplsoccer GitHub: https://github.com/andrewRowlinson/mplsoccer
- RabonaJS: https://github.com/rabona-labs/rabonajs
- d3-soccer: https://github.com/probberechts/d3-soccer
- StatsBomb open-data: https://github.com/statsbomb/open-data

## Appendix C — Developer Examples

Target developer experience: what a developer building with PitchKit in a React/Next.js app actually writes.

### C.1 One-time setup

Install the library — this is the "plumbing" layer (coordinate transforms, rendering), a normal
npm dependency you update but don't edit:

```bash
npm install @pitchkit/react
```

Then paste the theme tokens into `globals.css` (or install a preset via the registry, e.g.
`npx shadcn add @pitchkit/theme-broadcast` — see §8.7). No other configuration needed.

```css
:root {
  --pitch-surface: #1a472a;
  --pitch-stripe: #1d4f30;
  --pitch-lines: rgba(255, 255, 255, 0.8);
  --pitch-marker-primary: #3b82f6;
  --pitch-marker-goal: #f59e0b;
  --pitch-marker-miss: rgba(255, 255, 255, 0.4);
}

.dark {
  --pitch-surface: #0f2819;
  --pitch-lines: rgba(255, 255, 255, 0.6);
}
```

### C.2 Drawing a pitch

```typescript
import { Pitch } from "@pitchkit/react"

export function BasicPitch() {
  return <Pitch type="statsbomb" />
}
```

No size props means the pitch fills its container and recomputes on resize automatically — this is the default, not something you opt into. `type="statsbomb"` declares the coordinate system; the library handles all scaling.

### C.3 Shot map (a recipe)

"Shot map" is one of the composite recipes from §7.4 — `npx shadcn add shot-map` copies exactly
this file into `components/recipes/shot-map.tsx`, ready to restyle or rewire. What follows is
that recipe's actual source, importing the primitives from the npm package:

```typescript
import { Pitch, Scatter } from "@pitchkit/react"

type Shot = {
  location: [number, number]
  player:   { name: string }
  shot: { outcome: { name: string }; statsbomb_xg: number }
}

export function ShotMap({ shots }: { shots: Shot[] }) {
  return (
    <Pitch type="statsbomb" half>
      <Scatter
        data={shots}
        x={d => d.location[0]}
        y={d => d.location[1]}
        r={d => Math.sqrt(d.shot.statsbomb_xg) * 14 + 4}
        fill={d =>
          d.shot.outcome.name === "Goal"
            ? "var(--pitch-marker-goal)"
            : "var(--pitch-marker-miss)"
        }
        fillOpacity={d => d.shot.statsbomb_xg * 0.6 + 0.3}
        stroke="var(--pitch-lines)"
        strokeWidth={1}
        tooltip={d => (
          <div className="text-sm">
            <p className="font-semibold">{d.player.name}</p>
            <p className="text-muted-foreground">xG: {d.shot.statsbomb_xg.toFixed(2)}</p>
            <p>{d.shot.outcome.name}</p>
          </div>
        )}
      />
    </Pitch>
  )
}
```

Key points: `half` crops to the attacking half with one prop. `r`, `fill`, and `fillOpacity` each accept a static value or a function of the datum — same prop either way. Tooltip content is plain JSX; the library owns positioning.

### C.4 Pass network (a recipe)

Same pattern as C.3 — `npx shadcn add pass-network` copies this in:

```typescript
import { Pitch, Scatter, Arrows, Annotate } from "@pitchkit/react"

type Pass = {
  location: [number, number]
  pass:     { end_location: [number, number]; outcome?: { name: string } }
}

type AvgPosition = { name: string; x: number; y: number; passCount: number }

export function PassNetwork({
  passes,
  averagePositions,
}: {
  passes: Pass[]
  averagePositions: AvgPosition[]
}) {
  const completed = passes.filter(p => !p.pass.outcome)

  return (
    <Pitch type="statsbomb">
      <Arrows
        data={completed}
        x={d => d.location[0]}
        y={d => d.location[1]}
        x2={d => d.pass.end_location[0]}
        y2={d => d.pass.end_location[1]}
        stroke="var(--pitch-marker-primary)"
        strokeWidth={1.5}
        strokeOpacity={0.4}
        headSize={3}
      />
      <Scatter
        data={averagePositions}
        x={d => d.x}
        y={d => d.y}
        r={d => Math.sqrt(d.passCount) * 2.5 + 6}
        fill="var(--pitch-marker-primary)"
        stroke="var(--pitch-lines)"
        strokeWidth={2}
        tooltip={d => d.name}
      />
      <Annotate
        data={averagePositions}
        x={d => d.x}
        y={d => d.y}
        label={d => d.name.split(" ").at(-1) ?? d.name}
        className="fill-white text-[10px] font-semibold"
        offsetY={-14}
      />
    </Pitch>
  )
}
```

### C.5 Per-chart theme override

To give one chart a different look without touching `globals.css`, scope CSS variable overrides on a wrapper element. The cascade does the rest:

```typescript
export function PrintShotMap({ shots }: { shots: Shot[] }) {
  return (
    <div style={{
      "--pitch-surface": "#ffffff",
      "--pitch-stripe":  "#f5f5f5",
      "--pitch-lines":   "#222222",
    } as React.CSSProperties}>
      <ShotMap shots={shots} />
    </div>
  )
}
```

No prop drilling. No re-render. No provider.

### C.6 Tailwind styling

Resolved by [issue #7](https://github.com/yribeiro/pitchkit/issues/7) (see §8.7 for the
technical writeup). Four mechanisms, because marks and the pitch background need genuinely
different answers — pick the one that matches what you own:

**1. `className` on a mark you render yourself** — the direct replacement for `fill`/`stroke`,
not an addition to them:

```typescript
<Scatter
  data={shots}
  x={d => d.location[0]}
  y={d => d.location[1]}
  className="fill-emerald-400 stroke-white hover:fill-emerald-200"
/>
```

Don't pass `fill`/`stroke` alongside a colour-setting class — whichever visual prop you _do_
pass always wins over `className` (it's applied as inline style, and inline style always
beats a class at the same CSS property). Omit the prop entirely to hand that property to
Tailwind.

**2. A `data-pitchkit-*` attribute selector, for a mark whose JSX you don't own** — e.g. inside
a shadcn recipe wrapping `<Pitch>`. Every mark already carries
`data-pitchkit-mark`/`data-pitchkit-layer`/`data-pitchkit-part`, with zero code changes
required:

```typescript
<div className="[&_[data-pitchkit-mark=scatter]]:fill-cyan-400!">
  <ShotMap shots={shots} />
</div>
```

The trailing `!` (Tailwind's important modifier) is required here — unlike mechanism 1, there
was no `className` on that mark to signal it should back off its own themed default, so an
ordinary class can't out-rank the inline style it still carries.

**3. The pitch background itself isn't a mark** — `--pitch-surface`/`--pitch-stripe`/
`--pitch-lines` are CSS variables, restyled the same way with or without Tailwind in the
picture. Zero-setup, using Tailwind's arbitrary-property syntax:

```typescript
<Pitch type="statsbomb" className="[--pitch-surface:var(--color-emerald-950)]" />
```

Or install a small `@utility` recipe once (`pitch-surface-*`/`pitch-stripe-*`/
`pitch-lines-*`, via `--value(--color-*)`) for the nicer, autocompletable spelling:

```typescript
<Pitch type="statsbomb" className="pitch-surface-emerald-950 pitch-stripe-emerald-800" />
```

**4. `--pitch-line-width`** (stroke width, default `1.5`) gets the same recipe shape as
mechanism 3, but validates a bare/arbitrary number (`--value(number, [number])`) rather than
looking one up in the theme — Tailwind has no rich preset scale for stroke width the way it
does for colour, so `pitch-line-width-4` and `[--pitch-line-width:4]` are equally reasonable.

All four demonstrated together in `examples/react-nextjs/app/TailwindPanel.tsx`.

### C.7 The developer mental model

Five things to hold in your head — that's all:

1. **`<Pitch>` = the container that owns the coordinate system.** Declare the provider via `type`.
2. **Children = layers, stacked in render order.** `<Scatter>`, `<Arrows>`, `<Heatmap>` — composable like HTML elements.
3. **Accessors = how your data maps to visuals.** Always a typed function of the datum: `x={d => d.location[0]}`.
4. **Colours = CSS variables.** Defined once in `globals.css`, dark mode for free, override per-chart with a wrapper div.
5. **Tailwind reaches marks two ways, the background a third.** `className` on marks you own, a `data-pitchkit-*` selector on marks you don't, `@utility` recipes for the CSS-variable-driven background — never fight the inline style, hand it the property instead (§C.6).
