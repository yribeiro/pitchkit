# PitchKit — product requirements

> A React-first football visualisation library that brings mplsoccer's surface (pitches,
> heatmaps, pass networks, radars, pizza charts) to the browser as React components, with
> responsive rendering, good docs, and a showcase site. MIT-licensed, built in the open.

_Owner: Yohahn Ribeiro_

This is the product document: the problem, who it's for, and what good looks like. The
detail lives in three companion documents:

| Document                          | Contents                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| [Architecture](./architecture.md) | Rendering, coordinates, packages, styling, engineering standards, implementation notes. |
| [Roadmap](./roadmap.md)           | Feature inventory with status, milestones, release history, mplsoccer parity reference. |
| [Decision log](./decisions.md)    | What was decided, why, and what follows from it. Read before changing a covered area.   |

---

## Summary

Football analytics on the web has no equivalent to Python's **mplsoccer**. Analysts who want
interactive pitch visualisations in a web app stitch together D3 wrappers, half-maintained
plugins, or their own SVG. PitchKit is one well-typed, well-documented library that covers
mplsoccer's feature set, renders well on phones and desktops, and fits modern React and
Next.js apps.

It has three parts:

1. **The library:** a framework-agnostic core plus React bindings, published to npm, with
   optional open-data loaders.
2. **Documentation:** API reference, guides, and live examples.
3. **A showcase site** in the shadcn/ui design language, which is also the docs home.

## Background and problem

mplsoccer (by Andrew Rowlinson and Anmol Durgapal) is the standard for football pitch
visualisation in Python. It draws pitches across nine provider coordinate systems and layers
scatter, arrows, comets, heatmaps, hexbins, KDE, flow, hulls, Voronoi and sonars onto them,
alongside radar, pizza and bumpy charts. Its output is static images, and it is Python-only.

Analytics is increasingly delivered in the browser: club tools, scouting platforms, fan
products. There, the gaps are:

- **No React-first equivalent.** Existing options are thin or unmaintained.
- **No responsive story.** Fixed-size images don't suit fluid, high-DPI, touch layouts.
- **No interactivity.** Tooltips, selection and live data updates are expected on the web.
- **A fragmented ecosystem.** Pitch drawing, statistical layers and player charts live in
  separate, incompatible libraries.

## Competitive landscape

| Library                   | Language | Scope                                 | Rendering           | Gap                                  |
| ------------------------- | -------- | ------------------------------------- | ------------------- | ------------------------------------ |
| mplsoccer                 | Python   | Full: pitch, stats, radar/pizza, data | matplotlib (static) | Not web; static; Python-only         |
| RabonaJS                  | JS       | Pitch and event layers                | D3/SVG              | Narrow; no types; little stats depth |
| d3-soccer                 | JS       | Pitch, heatmap, SPADL actions         | D3/SVG              | Stale; D3-coupled; no types          |
| football-lineup-generator | TS       | Lineups only                          | Canvas              | No event data or stats layers        |
| Pitch.js                  | JS       | Pitch rendering                       | DOM/SVG             | Pitch only                           |

Nobody has built a comprehensive, React-first, typed "mplsoccer for the web".

## Goals and non-goals

### Goals

- **Functional parity with mplsoccer's core** (not pixel-perfect): pitches for the major
  providers, the plotting primitives, statistical layers, and radar/pizza/bumpy charts.
- **TypeScript-first:** exported types, good autocomplete, type-safe accessors.
- **Framework-agnostic core with a thin React binding**, and documented Next.js (App Router,
  SSR) use.
- **Responsive and multi-device** by default, from phone to 4K.
- **Interactive:** tooltips, selection, transitions, data-driven updates.
- **Good docs:** API reference, guides, and live examples for every feature.
- **Open source, built in public**, with CI, tests, semver and changelogs.
- **Legible to AI coding agents.** "The developer" is often a person directing an agent.
  That raises the bar on API and docs shape: generic accessors so no adapter is needed,
  every example a complete standalone file, and "load open data → chart" as one runnable
  example rather than two halves to wire together.

### Non-goals (v1)

- **No analytics:** no xG models or event tagging. Consumers bring their own metrics.
- **Not a general charting library:** football-specific, not a D3 or Plotly replacement.
- **No 3D** or tracking fly-throughs in v1.
- **No proprietary data fetching**, only open-data loaders that are safe to redistribute.
- **No byte-for-byte matplotlib reproduction.** Web-native looks are fine.

## Target users

1. **The analyst-developer** who knows mplsoccer and wants the same power in a React
   dashboard. The primary persona.
2. **The club or product engineer** building scouting or match-analysis tools, who needs
   reliable, themeable, fast components.
3. **The data journalist or creator** who wants good-looking, shareable interactive charts.
4. **The student or hobbyist** learning football analytics, who needs gentle docs and
   copy-paste examples.

Any of these may be working through an AI coding agent. That doesn't add a persona, but it
shapes how the API and docs are written (see Goals).

## Product principles

- **Coordinates in, pixels out.** Users think in provider coordinates; the library owns all
  scaling, orientation and flipping.
- **Composable layers over monolithic charts.** A pitch is a scene; everything else is a
  layer on it, like mplsoccer's `pitch.draw()` then `pitch.scatter(...)`.
- **Sensible defaults, full control.** Good with zero config; every visual property can be
  overridden and themed.
- **The core knows nothing about React.**
- **Responsive by construction.**
- **Accessible:** keyboard- and screen-reader-aware, with colour-blind-safe defaults.

## Success metrics

- **Adoption:** npm weekly downloads, GitHub stars, dependent repos.
- **Developer experience:** first pitch on screen within five minutes of the Quickstart.
- **Coverage:** at least 90% of the phase-1 mplsoccer inventory shipped at v1.0
  ([roadmap](./roadmap.md#feature-inventory)).
- **Performance:** layers meet their render and bundle budgets
  ([architecture](./architecture.md#performance-budgets)).
- **Docs engagement:** example interactions, migration-page traffic.

## Risks and open questions

- **Scope creep:** mplsoccer is large. Mitigation: phase gates, and recipes over rigid
  components.
- **Rendering lock-in:** keep the renderer abstraction clean so the SVG-first hybrid stays
  reversible.
- **SSR and Canvas friction:** keep the client boundary deliberate, with SVG that renders on
  the server.
- **Solo maintenance:** keep the core small and well tested; lean on Changesets and CI.
- **Open:** selective D3 modules (`d3-scale`, `d3-delaunay`, `d3-contour`) or hand-rolled
  geometry? Current lean: selective D3 for maths, custom for rendering.

Resolved questions are in the [decision log](./decisions.md).

## Naming

**PitchKit**: the `@pitchkit` npm scope, the `yribeiro/pitchkit` repo, and
[pitchkitjs.com](https://www.pitchkitjs.com). See
[D23](./decisions.md#d23-the-name-is-pitchkit).

## References

- mplsoccer docs: https://mplsoccer.readthedocs.io
- mplsoccer on GitHub: https://github.com/andrewRowlinson/mplsoccer
- RabonaJS: https://github.com/rabona-labs/rabonajs
- d3-soccer: https://github.com/probberechts/d3-soccer
- StatsBomb open data: https://github.com/statsbomb/open-data
