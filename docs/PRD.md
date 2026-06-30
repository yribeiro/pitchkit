# ⚽ PRD — PitchKit (mplsoccer for the web)

> **TL;DR** — Build the missing piece of the football-analytics web stack: a TypeScript-native, framework-agnostic visualization library that brings mplsoccer's full surface (pitches, heatmaps, pass networks, radars, pizza charts) to the browser, with first-class React/Next.js bindings, responsive multi-device rendering, great docs, and a shadcn-style showcase site. Personal project, MIT-licensed, built in the open on GitHub.

*Status: Draft v0.2 · Owner: Yohahn Ribeiro · Last updated: 28 Jun 2026*

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

| Library | Lang | Scope | Render | Maintained | Gap vs this project |
|---------|------|-------|--------|-----------|-------------------|
| **mplsoccer** | Python | Full (pitch + stats + radar/pizza/bumpy + data) | matplotlib (static) | ✅ Active | Not web; static; Python-only |
| **RabonaJS** | JS | Pitch + event layers (passes) | D3/SVG | Low activity | Narrow; no TS types; no radar/pizza/heatmap depth |
| **d3-soccer** | JS | Pitch + heatmap + SPADL actions | D3/SVG | Stale (~1yr) | D3-coupled; no TS; partial feature set |
| **football-lineup-generator** | TS | Lineups/formations only | Canvas | Low activity | No event data, no stats layers |
| **Pitch.js** | JS | Pitch rendering | DOM/SVG | Minimal | Pitch only, no analytics layer |

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

| Feature | mplsoccer ref | Phase |
|---------|---------------|-------|
| Horizontal pitch | `Pitch` | M |
| Vertical pitch | `VerticalPitch` | M |
| Half-pitch / padding / crop | `half`, `pad_*` | M |
| Pitch types: StatsBomb, Opta, Wyscout, UEFA/metric, Tracab, SkillCorner, SecondSpectrum, MetricaSports, custom | `pitch_type` (9 types) | M (SB/Opta/UEFA) → 1 (rest) |
| Styling: grass/stripes, line colour/width/alpha, goal types (line/box/circle) | `pitch_color`, `stripe`, `goal_type` | M→1 |
| Coordinate standardizer (provider→provider) | `Standardizer` | 1 |

### 7.2 Plotting primitives (per-event marks)

| Feature | mplsoccer ref | Phase |
|---------|---------------|-------|
| Scatter (incl. football marker, rotation, custom markers) | `scatter` | M |
| Arrows / quiver | `arrows` | M |
| Comet lines (tapered, gradient) | `lines` | M |
| Annotate / text labels | `annotate` | M |
| Polygon | `polygon` | 1 |
| Convex hull | `convexhull` | 1 |
| Voronoi | `voronoi` | 1 |
| Goal angle / shot cone | `goal_angle` | 1 |
| Angle & distance helpers | `calculate_angle_and_distance` | 1 |

### 7.3 Statistical / aggregate layers

| Feature | mplsoccer ref | Phase |
|---------|---------------|-------|
| Heatmap (binned) | `bin_statistic` • `heatmap` | M |
| Positional heatmap (Juego de Posición zones) | `bin_statistic_positional` • `heatmap_positional` | 1 |
| Heatmap labels | `label_heatmap` | 1 |
| Hexbin | `hexbin` | 1 |
| KDE (kernel density) | `kdeplot` | 1 |
| Pass/flow diagram (binned direction+magnitude) | `flow` | 1 |
| Sonars / sonar grid | `sonar`, `sonar_grid` | L |

### 7.4 Composite recipes (docs-level, built on primitives)

Pass network, shot map, pass map, pressure heatmap, progressive-pass map, expected-threat grid. Shipped as **documented examples/recipes** rather than rigid components, so users compose them. Phase **1**.

### 7.5 Non-pitch charts

| Feature | mplsoccer ref | Phase |
|---------|---------------|-------|
| Radar chart (with range bands, lower-is-better flip) | `Radar` | 1 |
| Pizza / percentile (Nightingale) chart, incl. comparison mode | `PyPizza` | 1 |
| Bumpy chart (rank-over-time) | `Bumpy` | L |

### 7.6 Supporting utilities

| Feature | mplsoccer ref | Phase |
|---------|---------------|-------|
| Grid / jointgrid layout (pitch + title + endnote + marginals) | `grid`, `jointgrid` | 1 |
| Inset axes / inset image (e.g. badges, mini-charts on pitch) | `inset_axes`, `inset_image` | L |
| Font management | `FontManager` | M (web fonts are trivial; document the pattern) |
| StatsBomb open-data adapter | `Sbopen` | 1 |
| (Out of scope) authenticated StatsBomb API/local | `Sbapi`, `Sblocal` | — |

## 8. Technical Architecture

### 8.1 Rendering strategy — hybrid SVG + Canvas

- **SVG** for pitch geometry and discrete marks (scatter, arrows, lines, annotations, hulls, Voronoi). Rationale: crisp at any DPI, trivially scalable/responsive, DOM-addressable for hover/tooltip/selection/accessibility, SSR-friendly.
- **Canvas (2D, optional WebGL later)** for dense raster layers (heatmaps, KDE, hexbins, and large tracking-frame scatter with thousands of points) where per-element DOM nodes would tank performance.
- A **renderer abstraction** sits behind a single scene/layer API so a layer declares *what* to draw; the renderer decides SVG vs Canvas. This keeps the public API identical regardless of backend and leaves room for a pure-Canvas or WebGL renderer later.

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
- `apps/docs` — the showcase + docs site.
- `examples/` — runnable Next.js + Vite examples.

Build with **tsup** (ESM + d.ts). Tree-shakeable, `sideEffects: false`. Publish under the `@pitchkit` npm scope.

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
  --pitch-surface:        #1a472a;
  --pitch-stripe:         #1d4f30;
  --pitch-lines:          rgba(255, 255, 255, 0.8);
  --pitch-marker-primary: #3b82f6;
  --pitch-marker-goal:    #f59e0b;
  --pitch-marker-miss:    rgba(255, 255, 255, 0.4);
}

.dark {
  --pitch-surface: #0f2819;
  --pitch-lines:   rgba(255, 255, 255, 0.6);
}
```

**Layer 2 — Tailwind `@theme inline`** maps tokens to utility classes at zero cost:

```css
@theme inline {
  --color-pitch-surface:        var(--pitch-surface);
  --color-pitch-marker-primary: var(--pitch-marker-primary);
  --color-pitch-marker-goal:    var(--pitch-marker-goal);
}
```

SVG marks can now use `className="fill-pitch-marker-goal"` exactly like any other shadcn component. HTML chrome (tooltips, legends) uses normal shadcn classes like `text-muted-foreground`.

**Layer 3 — Canvas reads the same vars at draw time:**

```typescript
const surface = getComputedStyle(containerEl)
  .getPropertyValue('--pitch-surface').trim();
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

**Resolution order per visual property:** accessor prop → explicit static prop → CSS variable default → library built-in.

**Token discoverability — the only TS in the theming layer:**

```typescript
export const pitchTokens = {
  surface:       '--pitch-surface',
  stripe:        '--pitch-stripe',
  lines:         '--pitch-lines',
  markerPrimary: '--pitch-marker-primary',
  markerGoal:    '--pitch-marker-goal',
  markerMiss:    '--pitch-marker-miss',
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
- **Live, editable examples** (code + rendered output side by side) for every feature — the single biggest adoption driver.
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

### Milestone 0 — Foundations

- [ ] Monorepo scaffold (pnpm/Turborepo/tsup), CI, lint/test baseline.
- [ ] Coordinate model + transform pipeline + `Standardizer` core, fully unit-tested.
- [ ] SVG renderer + scene/layer architecture.

### Milestone 1 — MVP (core pitch + primitives)

- [ ] `Pitch` / `VerticalPitch`, half/pad/crop, StatsBomb + Opta + UEFA types, styling.
- [ ] Scatter, Arrows, Comet lines, Annotate.
- [ ] Binned Heatmap (Canvas path).
- [ ] `@pitchkit/react` bindings + responsive sizing + tooltips.
- [ ] Docs site skeleton with live examples for the above.
- [ ] First npm publish (0.1.x) + README hero.

### Milestone 2 — v1.0 (parity push)

- [ ] Remaining pitch types + Standardizer exposed.
- [ ] Positional heatmap, hexbin, KDE, flow, polygon, convex hull, Voronoi, goal angle.
- [ ] Radar + Pizza charts.
- [ ] StatsBomb open-data adapter.
- [ ] Grid/jointgrid layout; recipe pages (pass network, shot map).
- [ ] Full API reference; migration cheatsheet; gallery.

### Milestone 3 — later

- [ ] Sonars, bumpy chart, inset images.
- [ ] WebGL renderer for tracking-scale data; animation/timeline helpers.
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
- **Open question:** Ship composite charts (pass network) as components or documented recipes only? Leaning recipes for v1 to avoid premature API lock-in.

## 14. Naming

Working name: **PitchKit** / npm scope `@pitchkit`. Needs final npm + GitHub availability check. Shortlist: *Pitchwright, Touchline, Chalkboard, Footwork, Tifo*. Criteria: short, npm-scope-friendly, not trademark-conflicting, evokes football + toolkit.

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

Install via the shadcn registry:

```bash
npx shadcn add @pitchkit/pitch
```

This drops the component into `components/ui/pitch.tsx` and appends the following to `globals.css`. No other configuration needed.

```css
:root {
  --pitch-surface:        #1a472a;
  --pitch-stripe:         #1d4f30;
  --pitch-lines:          rgba(255, 255, 255, 0.8);
  --pitch-marker-primary: #3b82f6;
  --pitch-marker-goal:    #f59e0b;
  --pitch-marker-miss:    rgba(255, 255, 255, 0.4);
}

.dark {
  --pitch-surface:  #0f2819;
  --pitch-lines:    rgba(255, 255, 255, 0.6);
}
```

### C.2 Drawing a pitch

```typescript
import { Pitch } from "@/components/ui/pitch"

export function BasicPitch() {
  return <Pitch type="statsbomb" />
}
```

No size props means the pitch fills its container and recomputes on resize automatically — this is the default, not something you opt into. `type="statsbomb"` declares the coordinate system; the library handles all scaling.

### C.3 Shot map

```typescript
import { Pitch, Scatter } from "@/components/ui/pitch"

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

### C.4 Pass network

```typescript
import { Pitch, Scatter, Arrows, Annotate } from "@/components/ui/pitch"

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

### C.6 The developer mental model

Four things to hold in your head — that's all:

1. **`<Pitch>` = the container that owns the coordinate system.** Declare the provider via `type`.
2. **Children = layers, stacked in render order.** `<Scatter>`, `<Arrows>`, `<Heatmap>` — composable like HTML elements.
3. **Accessors = how your data maps to visuals.** Always a typed function of the datum: `x={d => d.location[0]}`.
4. **Colours = CSS variables.** Defined once in `globals.css`, dark mode for free, override per-chart with a wrapper div.
