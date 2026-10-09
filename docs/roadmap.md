# Roadmap

What PitchKit covers, what's left, and what has shipped.

- [Feature inventory](#feature-inventory)
- [Milestones](#milestones)
- [Release history](#release-history)

Status: ✅ shipped · 🟡 partial · ⬜ not started. Phase: **M** = MVP, **1** = v1.0,
**L** = later.

---

## Feature inventory

### Pitch drawing and geometry

| Feature                                         | Phase | Status                                                                                              |
| ----------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------- |
| Horizontal pitch                                | M     | ✅ `<Pitch>`                                                                                        |
| Vertical pitch                                  | M     | ✅ `<VerticalPitch>`                                                                                |
| Half-pitch, padding, crop                       | M     | ✅ `crop`, `padding`, `cropForHalf()`                                                               |
| Pitch types                                     | M → 1 | 🟡 StatsBomb, Opta, Wyscout, UEFA, SkillCorner. Remaining: Tracab, SecondSpectrum, Metrica, custom. |
| Styling: stripes, line colour/width, goal types | M → 1 | ✅ CSS variables; `appearance.stripes`, `goalType` (`line`/`box`), `linesOnTop`                     |
| Coordinate standardiser (provider → provider)   | 1     | 🟡 `createStandardizeTransform` (uniform-extent). No marking-interpolated `Standardizer` yet.       |

### Plotting primitives

| Feature                         | Phase | Status                                              |
| ------------------------------- | ----- | --------------------------------------------------- |
| Scatter                         | M     | ✅ (no football marker or custom marker shapes yet) |
| Arrows                          | M     | ✅                                                  |
| Comet lines (tapered, gradient) | M     | ✅                                                  |
| Annotate                        | M     | ✅                                                  |
| Polygon                         | 1     | ✅                                                  |
| Convex hull                     | 1     | ✅                                                  |
| Voronoi                         | 1     | ✅                                                  |
| Goal angle                      | 1     | ✅                                                  |
| Angle and distance helpers      | 1     | ⬜                                                  |

### Statistical and aggregate layers

| Feature                                      | Phase | Status |
| -------------------------------------------- | ----- | ------ |
| Heatmap (binned)                             | M     | ✅     |
| Positional heatmap (Juego de Posición zones) | 1     | ✅     |
| Heatmap labels                               | 1     | ⬜     |
| Hexbin                                       | 1     | ✅     |
| KDE                                          | 1     | ✅     |
| Flow (binned direction and magnitude)        | 1     | ✅     |
| Sonars                                       | L     | ⬜     |

### Composite recipes

Pass network, shot map, pass map, pressure heatmap, progressive-pass map, expected-threat
grid. Phase **1**, ⬜. They ship as shadcn registry items
([D10](./decisions.md#d10-marks-ship-on-npm-recipes-and-theme-presets-ship-as-shadcn-registry-items)),
which needs registry infrastructure first
([#23](https://github.com/yribeiro/pitchkit/issues/23),
[#24](https://github.com/yribeiro/pitchkit/issues/24)).

"Load open data → chart" examples are a separate category and matter most to agents: one
complete file from a match id to a finished chart. 🟡 The Quickstart and every
[Data](https://www.pitchkitjs.com/docs/data) page do this; the `/gallery` cards still use
hardcoded data ([#27](https://github.com/yribeiro/pitchkit/issues/27)).

### Non-pitch charts

| Feature                                                 | Phase | Status                                                                           |
| ------------------------------------------------------- | ----- | -------------------------------------------------------------------------------- |
| Radar (range bands, lower-is-better flip)               | 1     | ✅ `<RadarChart>` (0.6.0)                                                        |
| Pizza / percentile (Nightingale), incl. comparison mode | 1     | ✅ `<PizzaChart>` (0.6.0)                                                        |
| Bumpy chart (rank over time)                            | L     | ⬜                                                                               |
| Goal view: shot placement in the goal mouth             | 1     | ✅ `<GoalView>`, `<GoalShots>`                                                   |
| Race chart: cumulative step lines over match minutes    | 1     | ✅ `<RaceChart>` (0.6.0, [PR #78](https://github.com/yribeiro/pitchkit/pull/78)) |
| Match momentum: signed bars per half, with event icons  | 1     | ✅ `<MomentumChart>` (0.6.0)                                                     |

`<RaceChart>` is the chart usually called an xG race chart or xG timeline, and it is **not
mplsoccer parity**: mplsoccer's non-pitch charts are `Radar`, `PyPizza` and `Bumpy`, with nothing
cumulative. It is the first in the Charts docs section
([D23](./decisions.md#d23-non-pitch-charts-are-roots-with-their-own-scales),
[D24](./decisions.md#d24-charts-get-a-top-level-docs-section-and-the-gallery-a-timeline-category)).
Radar and pizza are polar and share none of its `chart/` scaffold; the bumpy chart would reuse it.

`<MomentumChart>` is the second, also **not mplsoccer parity**
([D25](./decisions.md#d25-momentumchart-signed-values-bars-to-the-next-sample-our-own-icons)). It takes
signed values at any interval as one flat list tagged with a `period`, and a separate list of events drawn as icons.
PitchKit draws momentum and does not compute it. Follow-ups, none started: a `<MomentumEvents>`-style
helper for substitutions, which crowd the icon row, and the same keyboard and table-view gaps as the
race chart.

`<RadarChart>` is mplsoccer parity for `Radar`
([D26](./decisions.md#d26-radarchart-callers-numbers-translucent-shapes-click-to-replace)):
per-axis ranges, lower-is-better flips, range rings with values, and up to three overlaid series.
It adds what mplsoccer can't: rotated labels as a prop, a hover and touch readout, and axis labels
that open the caller's detail view in place of the chart.

`<PizzaChart>` is mplsoccer parity for `PyPizza`
([D27](./decisions.md#d27-pizzachart-slices-coloured-by-group-series-side-by-side-or-overlaid)):
slices coloured by group, value boxes, and a comparison mode. `seriesLayout` chooses side by side
(up to three players) or overlaid (two, as mplsoccer does), and slices open the caller's detail view.
Follow-ups, none started: keyboard focus giving the readout on the radar's axis labels the way slices
do, and a table view of the values for both.

`<GoalView>` is a coordinate root beside `<Pitch>`, not a chart
([D29](./decisions.md#d29-goalview-a-third-coordinate-root-with-the-providers-goal-mouth-frame)), and
also **not mplsoccer parity**. Its frames are `statsbomb` and `metric`. Follow-ups, none started:
frames for other providers once their goal-mouth data can be verified. Its gallery card is the
England–Switzerland shootout, under Shooting.

Follow-ups, none started: keyboard focus giving the crosshair readout, a table view of the values,
a `<RaceEvents>` child as sugar over the annotation slot once the manual version has been written
twice, end labels for three or more series, and a test that the bundled skill lists every exported
component.

### Supporting utilities

| Feature                                    | Phase | Status                                                                                                                      |
| ------------------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------- |
| Grid / jointgrid layout                    | 1     | ⬜                                                                                                                          |
| Inset axes and images                      | L     | ⬜                                                                                                                          |
| Fonts                                      | M     | Not needed: web fonts are CSS.                                                                                              |
| Open-data loaders                          | 1     | ✅ StatsBomb (events + 360), SkillCorner, Wyscout. Metrica is open ([#30](https://github.com/yribeiro/pitchkit/issues/30)). |
| Authenticated StatsBomb API / local files  | —     | Out of scope                                                                                                                |
| Image export (PNG/SVG) with logo/watermark | 1     | ⬜                                                                                                                          |

Image export is the path from a finished chart out of the browser tab. SVG layers export as
they are. Canvas layers need their `devicePixelRatio`-scaled buffer flattened into the same
output. It is planned as a core utility (`exportToPng`/`exportToSvg`) plus a docs recipe, not
a component prop, because export is a one-off action rather than part of the render tree.

---

## Milestones

### Milestone 0 — Foundations ✅

Monorepo scaffold, CI, lint and test baseline; coordinate model and transform pipeline;
SVG renderer and scene/layer architecture.

### Milestone 1 — MVP ✅

Complete as of 2026-09-06.

- Pitch styling and theming, SVG mark layers, and the Canvas heatmap in `core`
  ([PR #3](https://github.com/yribeiro/pitchkit/pull/3),
  [PR #4](https://github.com/yribeiro/pitchkit/pull/4)).
- `@pitchkit/react`: `<Pitch>`, `<VerticalPitch>`, the mark components, `<Heatmap>`,
  tooltips, and `usePitch()`, with the `examples/react-vite` and `examples/react-nextjs` review
  apps ([PR #5](https://github.com/yribeiro/pitchkit/pull/5)).
- SVG painters made internal ([#6](https://github.com/yribeiro/pitchkit/issues/6),
  [PR #16](https://github.com/yribeiro/pitchkit/pull/16)) and Tailwind integration
  ([#7](https://github.com/yribeiro/pitchkit/issues/7),
  [PR #13](https://github.com/yribeiro/pitchkit/pull/13)).
- Docs site skeleton ([PR #18](https://github.com/yribeiro/pitchkit/pull/18)) and the
  shadcn-style showcase site ([PR #32](https://github.com/yribeiro/pitchkit/pull/32)).

### Milestone 2 — v1.0 🚧

- [x] Geometric overlays: Flow, Polygon, Convex Hull, Voronoi, Goal Angle
      ([PR #25](https://github.com/yribeiro/pitchkit/pull/25)).
- [x] Density overlays: Positional Heatmap, Hexbin, KDE
      ([PR #39](https://github.com/yribeiro/pitchkit/pull/39)), and `appearance.linesOnTop`.
- [x] `<RaceChart>`, the first non-pitch chart and the first with no mplsoccer equivalent
      ([PR #78](https://github.com/yribeiro/pitchkit/pull/78)).
- [x] `<MomentumChart>`, match momentum bars with an event icon row.
- [x] Open-data loaders: StatsBomb events ([PR #50](https://github.com/yribeiro/pitchkit/pull/50))
      and 360 ([PR #52](https://github.com/yribeiro/pitchkit/pull/52)), SkillCorner
      ([PR #58](https://github.com/yribeiro/pitchkit/pull/58)), Wyscout
      ([PR #72](https://github.com/yribeiro/pitchkit/pull/72)).
- [ ] Remaining pitch types. Done: `skillcorner` with general centre-origin support
      ([PR #62](https://github.com/yribeiro/pitchkit/pull/62)), and `wyscout`, which also
      fixed square rendering of normalised grids
      ([#2](https://github.com/yribeiro/pitchkit/issues/2)). Remaining: Tracab,
      SecondSpectrum, Metrica, custom; a public `Standardizer`.
- [x] Radar and pizza charts ([#21](https://github.com/yribeiro/pitchkit/issues/21)):
      `<RadarChart>` and `<PizzaChart>`.
- [x] Goal view ([#22](https://github.com/yribeiro/pitchkit/issues/22)): `<GoalView>` with
      `<GoalShots>`, togglable width and height markers, and the penalty spot in perspective.
- [ ] shadcn registry infrastructure and the first recipes: attack/territory
      ([#23](https://github.com/yribeiro/pitchkit/issues/23)), pass map
      ([#24](https://github.com/yribeiro/pitchkit/issues/24)).
- [ ] Interactive pan and zoom ([#26](https://github.com/yribeiro/pitchkit/issues/26)).
- [ ] Real StatsBomb data in the gallery ([#27](https://github.com/yribeiro/pitchkit/issues/27)).
- [ ] Richer SkillCorner visualisations: off-ball runs, phases of play, pressure density,
      passing options ([#59](https://github.com/yribeiro/pitchkit/issues/59)). The selectors
      exist and are tested; this is presentation work only.
- [ ] Grid / jointgrid layout.
- [x] API reference, migration page, gallery, Styling section
      ([PR #74](https://github.com/yribeiro/pitchkit/pull/74)).
- [ ] **Agent-legibility (AX)** ([#40](https://github.com/yribeiro/pitchkit/issues/40)).
      Done: the bundled Agent Skill ([PR #46](https://github.com/yribeiro/pitchkit/pull/46)) and
      `llms.txt` ([PR #48](https://github.com/yribeiro/pitchkit/pull/48)). Remaining:
      `AGENTS.md`. Follow-ons, all open:
      [#41](https://github.com/yribeiro/pitchkit/issues/41) (audit `Scene` for JSON
      serialisability and headless rendering),
      [#42](https://github.com/yribeiro/pitchkit/issues/42) (evaluate, not commit to, an MCP
      server), [#43](https://github.com/yribeiro/pitchkit/issues/43) (an agent eval harness,
      which #41 and #42's results depend on).
- [x] Brand identity: the PitchKit mark ([PR #47](https://github.com/yribeiro/pitchkit/pull/47)).

### Milestone 3 — Publishing 🟡

Pulled forward ahead of Milestone 2 to claim the namespace and make the library installable.

- [x] Published to npm under the `pitchkit` org (see [release history](#release-history)).
- [x] Docs site live at [pitchkitjs.com](https://www.pitchkitjs.com), auto-deploying from
      `main` via Vercel.
- [x] Repo hygiene: MIT licence, READMEs, `CONTRIBUTING.md`, issue and PR templates, npm
      metadata.
- [ ] Automated releases via npm Trusted Publishing
      ([#36](https://github.com/yribeiro/pitchkit/issues/36)); canary tags from `main`.
- [ ] Label good first issues.

### Milestone 4 — Later

- [ ] Sonars, bumpy chart, inset images.
- [ ] WebGL renderer for tracking-scale data; animation and timeline helpers (frame playback
      with a scrubber). SkillCorner and Metrica open tracking data make this buildable
      without a commercial licence.
- [ ] Vue or Svelte bindings (`core` already allows it).

---

## Release history

All three packages are published under the `pitchkit` npm org. Each package's own
`CHANGELOG.md` has the details.

| Date       | `core` | `react` | `data-providers` | What shipped                                                                                                                                                                                                                                                          |
| ---------- | ------ | ------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-08 | 0.1.0  | 0.1.0   | —                | First publish.                                                                                                                                                                                                                                                        |
| 2026-09-09 | 0.2.0  | 0.2.0   | —                | Density overlays, `appearance.linesOnTop`. First tarballs with README and LICENSE.                                                                                                                                                                                    |
| 2026-09-10 | —      | 0.3.0   | 0.1.0            | Bundled Agent Skill. `data-providers` first publish: StatsBomb events.                                                                                                                                                                                                |
| 2026-09-12 | —      | 0.3.1   | 0.2.0            | Fix: empty tooltip on a falsy accessor. StatsBomb 360 tracking.                                                                                                                                                                                                       |
| 2026-09-13 | —      | —       | 0.3.0            | SkillCorner provider (adds `csv-parse`).                                                                                                                                                                                                                              |
| 2026-09-13 | 0.3.0  | 0.4.0   | —                | `skillcorner` pitch type and centre-origin support.                                                                                                                                                                                                                   |
| 2026-09-13 | —      | 0.4.1   | —                | Skill fix: SkillCorner listed as both supported and nonexistent. Shipped without a changeset at first.                                                                                                                                                                |
| 2026-09-22 | 0.3.1  | 0.4.2   | 0.3.1            | npm metadata; package links point at the `www` host.                                                                                                                                                                                                                  |
| 2026-09-27 | 0.4.0  | 0.5.0   | 0.4.0            | Wyscout provider and pitch type; normalised grids render at real proportions ([#2](https://github.com/yribeiro/pitchkit/issues/2)).                                                                                                                                   |
| 2026-09-27 | —      | 0.5.1   | —                | Skill lists `--pitch-marker-goal`.                                                                                                                                                                                                                                    |
| 2026-10-03 | 0.5.0  | 0.6.0   | —                | `RaceChart`, `MomentumChart`, `RadarChart`, `PizzaChart`: the first non-pitch charts, with the cartesian and polar maths and chart theme tokens they share.                                                                                                           |
| 2026-10-06 | 0.6.0  | 0.7.0   | —                | **Breaking:** `RaceChart` and `MomentumChart` require a `period` on every event and datum ([#82](https://github.com/yribeiro/pitchkit/issues/82)). Fixes for chart edge cases (#83), overlaid pizza slice order (#89) and four layers on centre-origin pitches (#90). |
