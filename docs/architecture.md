# Architecture

How PitchKit is built: rendering, coordinates, packages, styling, and the engineering
standards around them. The reasons behind these choices are in the
[decision log](./decisions.md).

- [Rendering: SVG and Canvas](#rendering-svg-and-canvas)
- [Coordinates and pitch types](#coordinates-and-pitch-types)
- [Scene and layers](#scene-and-layers)
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
  `matchMedia('(pointer: coarse)')`. Tooltips are desktop-hover only today.
- **44×44 px hit areas** around small marks.
- **Adaptive density** at small widths: a `hideBelow` prop for labels, thinner strokes.
- **`touch-action: pan-y`** on the pitch root, so a vertical swipe scrolls the page.

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
- **Guides:** Quickstart, Guides, Components, Overlays, Agents, Styling, Data, and the
  mplsoccer → PitchKit migration page.
- **Gallery:** `/gallery`, finished visualisations with full source.
- **For agents:** `/llms.txt`, `/llms-full.txt`, `/llms-api.txt`, and per-page Markdown
  (append `.md` to any docs URL) ([D19](./decisions.md#d19-llmstxt-covers-the-narrative-docs-the-api-reference-is-separate)).

See [docs site conventions](#docs-site-conventions) for how to work in it.

---

## Engineering standards

| Area       | Standard                                                      | As built                                                                                                                                                           |
| ---------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Language   | TypeScript, strict                                            | Yes                                                                                                                                                                |
| Build      | tsup, Turborepo                                               | Yes (npm workspaces, not pnpm)                                                                                                                                     |
| Tests      | Vitest; happy-dom for components; Playwright visual snapshots | Vitest + happy-dom. `@pitchkit/core` held at 100% coverage. No visual regression yet.                                                                              |
| Quality    | ESLint, Prettier, typecheck in CI, size budgets               | ESLint, Prettier, typecheck. No size budgets yet.                                                                                                                  |
| CI         | Lint, typecheck, test, build on every PR                      | `.github/workflows/ci.yml`                                                                                                                                         |
| Releases   | Changesets for semver and changelogs; automated npm publish   | Changesets yes; publishing is manual ([D11](./decisions.md#d11-releases-are-manual-until-trusted-publishing-is-set-up))                                            |
| Docs       | Vercel                                                        | Auto-deploys every push to `main` via Vercel's GitHub App (no workflow or `vercel.json` in the repo). PRs get preview deployments. Deploys don't wait for CI.      |
| Dependency | Published packages keep a minimal runtime footprint           | `core`: none. `react`: `core` only (React is a peer). `data-providers`: `csv-parse` only. Dependabot alerts are all in private `apps/` and `examples/` workspaces. |

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

Any new module that reasons about a `0..length` box must convert through the extent frame
first. Tests that assumed the minimum corner is `(0, 0)` now derive it from
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
