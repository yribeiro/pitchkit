# Roadmap

What PitchKit covers, what's left, and what has shipped. Section numbers (§7, §11) are kept
from the original single-file PRD, because code comments cite them.

- [§7 Feature inventory](#7-feature-inventory)
- [§11 Milestones](#11-milestones)
- [Release history](#release-history)
- [Appendix A — mplsoccer reference](#appendix-a--mplsoccer-reference)

Status: ✅ shipped · 🟡 partial · ⬜ not started. Phase: **M** = MVP, **1** = v1.0,
**L** = later.

---

## 7. Feature inventory

Mapped from mplsoccer's modules so parity can be audited.

### 7.1 Pitch drawing & geometry

| Feature                                         | mplsoccer ref                        | Phase | Status                                                                                              |
| ----------------------------------------------- | ------------------------------------ | ----- | --------------------------------------------------------------------------------------------------- |
| Horizontal pitch                                | `Pitch`                              | M     | ✅ `<Pitch>`                                                                                        |
| Vertical pitch                                  | `VerticalPitch`                      | M     | ✅ `<VerticalPitch>`                                                                                |
| Half-pitch, padding, crop                       | `half`, `pad_*`                      | M     | ✅ `crop`, `padding`, `cropForHalf()`                                                               |
| Pitch types                                     | `pitch_type` (9 types)               | M → 1 | 🟡 StatsBomb, Opta, Wyscout, UEFA, SkillCorner. Remaining: Tracab, SecondSpectrum, Metrica, custom. |
| Styling: stripes, line colour/width, goal types | `pitch_color`, `stripe`, `goal_type` | M → 1 | ✅ CSS variables; `appearance.stripes`, `goalType` (`line`/`box`), `linesOnTop`                     |
| Coordinate standardiser (provider → provider)   | `Standardizer`                       | 1     | 🟡 `createStandardizeTransform` (uniform-extent). No marking-interpolated `Standardizer` yet.       |

### 7.2 Plotting primitives

| Feature                         | mplsoccer ref                  | Phase | Status                                              |
| ------------------------------- | ------------------------------ | ----- | --------------------------------------------------- |
| Scatter                         | `scatter`                      | M     | ✅ (no football marker or custom marker shapes yet) |
| Arrows                          | `arrows`                       | M     | ✅                                                  |
| Comet lines (tapered, gradient) | `lines`                        | M     | ✅                                                  |
| Annotate                        | `annotate`                     | M     | ✅                                                  |
| Polygon                         | `polygon`                      | 1     | ✅                                                  |
| Convex hull                     | `convexhull`                   | 1     | ✅                                                  |
| Voronoi                         | `voronoi`                      | 1     | ✅                                                  |
| Goal angle                      | `goal_angle`                   | 1     | ✅                                                  |
| Angle and distance helpers      | `calculate_angle_and_distance` | 1     | ⬜                                                  |

### 7.3 Statistical and aggregate layers

| Feature                                      | mplsoccer ref                                     | Phase | Status |
| -------------------------------------------- | ------------------------------------------------- | ----- | ------ |
| Heatmap (binned)                             | `bin_statistic` • `heatmap`                       | M     | ✅     |
| Positional heatmap (Juego de Posición zones) | `bin_statistic_positional` • `heatmap_positional` | 1     | ✅     |
| Heatmap labels                               | `label_heatmap`                                   | 1     | ⬜     |
| Hexbin                                       | `hexbin`                                          | 1     | ✅     |
| KDE                                          | `kdeplot`                                         | 1     | ✅     |
| Flow (binned direction and magnitude)        | `flow`                                            | 1     | ✅     |
| Sonars                                       | `sonar`, `sonar_grid`                             | L     | ⬜     |

### 7.4 Composite recipes

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

### 7.5 Non-pitch charts

| Feature                                                 | mplsoccer ref | Phase | Status                                                   |
| ------------------------------------------------------- | ------------- | ----- | -------------------------------------------------------- |
| Radar (range bands, lower-is-better flip)               | `Radar`       | 1     | ⬜ [#21](https://github.com/yribeiro/pitchkit/issues/21) |
| Pizza / percentile (Nightingale), incl. comparison mode | `PyPizza`     | 1     | ⬜ [#21](https://github.com/yribeiro/pitchkit/issues/21) |
| Bumpy chart (rank over time)                            | `Bumpy`       | L     | ⬜                                                       |

### 7.6 Supporting utilities

| Feature                                    | mplsoccer ref               | Phase | Status                                                                                                                      |
| ------------------------------------------ | --------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------- |
| Grid / jointgrid layout                    | `grid`, `jointgrid`         | 1     | ⬜                                                                                                                          |
| Inset axes and images                      | `inset_axes`, `inset_image` | L     | ⬜                                                                                                                          |
| Fonts                                      | `FontManager`               | M     | Not needed: web fonts are CSS.                                                                                              |
| Open-data loaders                          | `Sbopen`                    | 1     | ✅ StatsBomb (events + 360), SkillCorner, Wyscout. Metrica is open ([#30](https://github.com/yribeiro/pitchkit/issues/30)). |
| Authenticated StatsBomb API / local files  | `Sbapi`, `Sblocal`          | —     | Out of scope                                                                                                                |
| Image export (PNG/SVG) with logo/watermark | `add_image`                 | 1     | ⬜                                                                                                                          |

Image export is the path from a finished chart out of the browser tab. SVG layers export as
they are. Canvas layers need their `devicePixelRatio`-scaled buffer flattened into the same
output. It is planned as a core utility (`exportToPng`/`exportToSvg`) plus a docs recipe, not
a component prop, because export is a one-off action rather than part of the render tree.

---

## 11. Milestones

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

### Milestone 2 — v1.0 parity push 🚧

- [x] Geometric overlays: Flow, Polygon, Convex Hull, Voronoi, Goal Angle
      ([PR #25](https://github.com/yribeiro/pitchkit/pull/25)).
- [x] Density overlays: Positional Heatmap, Hexbin, KDE
      ([PR #39](https://github.com/yribeiro/pitchkit/pull/39)), and `appearance.linesOnTop`.
- [x] Open-data loaders: StatsBomb events ([PR #50](https://github.com/yribeiro/pitchkit/pull/50))
      and 360 ([PR #52](https://github.com/yribeiro/pitchkit/pull/52)), SkillCorner
      ([PR #58](https://github.com/yribeiro/pitchkit/pull/58)), Wyscout
      ([PR #72](https://github.com/yribeiro/pitchkit/pull/72)).
- [ ] Remaining pitch types. Done: `skillcorner` with general centre-origin support
      ([PR #62](https://github.com/yribeiro/pitchkit/pull/62)), and `wyscout`, which also
      fixed square rendering of normalised grids
      ([#2](https://github.com/yribeiro/pitchkit/issues/2)). Remaining: Tracab,
      SecondSpectrum, Metrica, custom; a public `Standardizer`.
- [ ] Radar and pizza charts ([#21](https://github.com/yribeiro/pitchkit/issues/21)).
- [ ] Goal view ([#22](https://github.com/yribeiro/pitchkit/issues/22)).
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

| Date       | `core` | `react` | `data-providers` | What shipped                                                                                                                        |
| ---------- | ------ | ------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-08 | 0.1.0  | 0.1.0   | —                | First publish.                                                                                                                      |
| 2026-09-09 | 0.2.0  | 0.2.0   | —                | Density overlays, `appearance.linesOnTop`. First tarballs with README and LICENSE.                                                  |
| 2026-09-10 | —      | 0.3.0   | 0.1.0            | Bundled Agent Skill. `data-providers` first publish: StatsBomb events.                                                              |
| 2026-09-12 | —      | 0.3.1   | 0.2.0            | Fix: empty tooltip on a falsy accessor. StatsBomb 360 tracking.                                                                     |
| 2026-09-13 | —      | —       | 0.3.0            | SkillCorner provider (adds `csv-parse`).                                                                                            |
| 2026-09-13 | 0.3.0  | 0.4.0   | —                | `skillcorner` pitch type and centre-origin support.                                                                                 |
| 2026-09-13 | —      | 0.4.1   | —                | Skill fix: SkillCorner listed as both supported and nonexistent. Shipped without a changeset at first.                              |
| 2026-09-22 | 0.3.1  | 0.4.2   | 0.3.1            | npm metadata; package links point at the `www` host.                                                                                |
| 2026-09-27 | 0.4.0  | 0.5.0   | 0.4.0            | Wyscout provider and pitch type; normalised grids render at real proportions ([#2](https://github.com/yribeiro/pitchkit/issues/2)). |
| 2026-09-27 | —      | 0.5.1   | —                | Skill lists `--pitch-marker-goal`.                                                                                                  |

---

## Appendix A — mplsoccer reference

The parity target.

- **Modules:** `pitch` (`Pitch`, `VerticalPitch`), `radar_chart` (`Radar`), `py_pizza`
  (`PyPizza`), `bumpy_chart` (`Bumpy`), `statsbomb` (`Sbopen`/`Sbapi`/`Sblocal`), `quiver`
  (`arrows`), `linecollection` (`lines`), `utils` (`FontManager`, `add_image`, `inset_axes`,
  `inset_image`, `set_labels`, `get_aspect`, `grid`).
- **Pitch methods:** `draw`, `grid`, `jointgrid`, `scatter`, `arrows`, `lines`, `annotate`,
  `polygon`, `convexhull`, `voronoi`, `goal_angle`, `bin_statistic` + `heatmap`,
  `bin_statistic_positional` + `heatmap_positional`, `label_heatmap`, `hexbin`, `kdeplot`,
  `flow`, `sonar` / `sonar_grid`, `inset_axes`, `inset_image`,
  `calculate_angle_and_distance`, `Standardizer`.
- **Pitch types (9):** statsbomb, opta, tracab, wyscout, metricasports, uefa (105×68 m),
  skillcorner, secondspectrum, custom.
- **Non-pitch charts:** Radar, PyPizza, Bumpy.
