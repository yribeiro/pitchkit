<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/brand/pitchkit-lockup-dark.svg">
  <img src="./assets/brand/pitchkit-lockup-light.svg" alt="PitchKit" height="64">
</picture>

React-first football pitch visualisation for the web — mplsoccer's feature set, built
for React and Next.js instead of matplotlib.

[![npm](https://img.shields.io/npm/v/@pitchkit/react)](https://www.npmjs.com/package/@pitchkit/react)
[![CI](https://github.com/yribeiro/pitchkit/actions/workflows/ci.yml/badge.svg)](https://github.com/yribeiro/pitchkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![X](https://img.shields.io/badge/X-%40pitchkitjs-000000?logo=x&logoColor=white)](https://x.com/pitchkitjs)
[![Instagram](https://img.shields.io/badge/Instagram-%40pitchkitjs-E4405F?logo=instagram&logoColor=white)](https://www.instagram.com/pitchkitjs)

**[pitchkitjs.com](https://www.pitchkitjs.com)** — docs, interactive examples, and the gallery.
See [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md) for attribution.

> **Early days — pre-`1.0`.** The API is usable and tested, but not yet stable; expect
> breaking changes before `1.0`.

## Install

```bash
npm install @pitchkit/react
```

`@pitchkit/core` comes along as a dependency; install it directly only if you want the
framework-agnostic maths without React.

## Quick start

```tsx
import { Pitch, Scatter } from "@pitchkit/react";

const shots = [
  { x: 112, y: 39, xg: 0.76, outcome: "goal" },
  { x: 105, y: 44, xg: 0.31, outcome: "saved" },
  { x: 99, y: 47, xg: 0.13, outcome: "off target" },
];

export function ShotMap() {
  return (
    <Pitch type="statsbomb">
      <Scatter
        data={shots}
        x={(s) => s.x}
        y={(s) => s.y}
        r={(s) => 3 + s.xg * 9}
        fill={(s) => (s.outcome === "goal" ? "#fb923c" : "#38bdf8")}
        tooltip={(s) => `${s.outcome} · xG ${s.xg.toFixed(2)}`}
      />
    </Pitch>
  );
}
```

No size props means the pitch fills its container and reflows on resize — responsive is the
default, not an opt-in. Pass `width`/`height` when you explicitly want a fixed size (exports,
OG images, PDFs).

## What's in the box

| Package                                                 | What it is                                                                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`@pitchkit/react`](./packages/react)                   | Declarative React components — the supported way to render. Start here.                                                             |
| [`@pitchkit/core`](./packages/core)                     | Zero-dependency engine: coordinate systems, transforms, scene model, geometry, heatmaps.                                            |
| [`@pitchkit/data-providers`](./packages/data-providers) | Optional loaders for open football data (StatsBomb, SkillCorner, Wyscout, Metrica). One dependency (`csv-parse`), and not on `core`/`react`. |

### Components

`<Pitch>` · `<VerticalPitch>` · `<Scatter>` · `<Annotate>` · `<Arrows>` · `<Comet>` ·
`<Heatmap>` · `<PositionalHeatmap>` · `<Hexbin>` · `<KDE>` · `<Polygon>` · `<ConvexHull>` ·
`<Voronoi>` · `<GoalAngle>` · `<Flow>` ·
`usePitch()`

Not everything draws on a pitch. `<RaceChart>` is a chart in its own right, a sibling of `<Pitch>`
and not a layer inside one: a cumulative step chart over match minutes, the chart usually called
an xG race chart or xG timeline. `useRaceChart()` is its counterpart to `usePitch()`.
`<MomentumChart>` draws match momentum as signed bars per half, with goals and cards on a row of
icons beneath. `<RadarChart>` is the player radar: one axis per metric on its own range, up to three
players, and axis labels that can open your own detail view in the chart's place. `<PizzaChart>` is
the percentile pizza: slices coloured by group, one to three players side by side or two overlaid, and
slices that open your own detail view.

Every visual prop takes either a static value or a function of the datum, so `fill="red"` and
`fill={(d) => d.teamColor}` are the same prop.

## Pitch types

`statsbomb` · `opta` · `uefa` · `skillcorner` · `wyscout` · `metrica` — each with the provider's real
coordinate space, so your data goes in unmodified. `getPitchDimensions(type)` exposes the
underlying numbers, and `cropForHalf()` crops to the attacking half.

## Loading real data

Layers take accessor functions, so PitchKit reads whatever shape your data is already in — no
adapter required. When fetching the data _is_ the friction, the optional
[`@pitchkit/data-providers`](./packages/data-providers) package goes from a match id to a chart
in one call:

```bash
npm install @pitchkit/data-providers
```

```tsx
import { fetchMatchEvents, shots, isGoal } from "@pitchkit/data-providers/statsbomb";

const events = await fetchMatchEvents(3943043); // Spain 2–1 England, Euro 2024 final
const spain = shots(events).filter((s) => s.team.name === "Spain");

<VerticalPitch type="statsbomb">
  <Scatter
    data={spain}
    x={(s) => s.x}
    y={(s) => s.y}
    fill={(s) => (isGoal(s) ? "orange" : "steelblue")}
  />
</VerticalPitch>;
```

StatsBomb [events](https://www.pitchkitjs.com/docs/data/statsbomb/events) and
[360 tracking](https://www.pitchkitjs.com/docs/data/statsbomb/360) are supported, along with
[SkillCorner](https://www.pitchkitjs.com/docs/data/skillcorner/tracking) broadcast tracking,
dynamic events and phases of play, [Wyscout](https://www.pitchkitjs.com/docs/data/wyscout/events)
match events, and [Metrica](https://www.pitchkitjs.com/docs/data/metrica/tracking) synchronised
tracking and events — each keeping that provider's own field names and values, only lifting
coordinates into the `x`/`y` an accessor wants. One dependency (`csv-parse`, for SkillCorner's
and Metrica's CSV files), and no dependency on `core` or `react` either.

## Theming

CSS variables only — no theme objects, no providers. Define once, every chart inherits, dark
mode included:

```css
:root {
  --pitch-surface: #1a472a;
  --pitch-stripe: #1d4f30;
  --pitch-lines: rgba(255, 255, 255, 0.8);
}
```

Marks also accept `className`, so Tailwind works directly (`className="fill-emerald-400"`).
Every element carries `data-pitchkit-mark` / `-layer` / `-part` attributes for styling marks
whose JSX you don't own.

## Next.js / SSR

SVG marks server-render cleanly. Because layer components take accessor _functions_ as props,
the `<Pitch>` tree must originate inside a `"use client"` component — React Server Components
can't pass functions across the client boundary. SSR still happens normally; only the
prop-serialisation boundary moves.

`<Heatmap>` is Canvas-backed and therefore client-only.

## Development

```bash
npm install
npm run build
npm test
```

Requires Node >= 22. The repo is an npm-workspaces + Turborepo monorepo; see
[CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow.

Runnable review apps live in `examples/react-vite` and `examples/react-nextjs`; the docs site
is in `apps/docs`.

## Documentation

- **[pitchkitjs.com](https://www.pitchkitjs.com)** — guides, API reference, and the
  [gallery](https://www.pitchkitjs.com/gallery) (every card ships its full source).
- [docs/PRD.md](./docs/PRD.md) — the product: problem, goals, users, principles.
- [docs/architecture.md](./docs/architecture.md) — how the library is built.
- [docs/roadmap.md](./docs/roadmap.md) — feature status, milestones and release history.
- [docs/decisions.md](./docs/decisions.md) — the decision log.

## Licence

[MIT](./LICENSE) © Yohahn Ribeiro
