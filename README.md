# PitchKit

[![npm](https://img.shields.io/npm/v/@pitchkit/react)](https://www.npmjs.com/package/@pitchkit/react)
[![CI](https://github.com/yribeiro/pitchkit/actions/workflows/ci.yml/badge.svg)](https://github.com/yribeiro/pitchkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

TypeScript-native football pitch visualisation for the web — mplsoccer's feature set, built
for React and Next.js instead of matplotlib.

**[pitchkitjs.com](https://pitchkitjs.com)** — docs, interactive examples, and the gallery.

> **Early days.** `0.1.x` is the first public release. The API is usable and tested, but not
> yet stable — expect breaking changes before `1.0`.

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

| Package                                 | What it is                                                                              |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| [`@pitchkit/react`](./packages/react)   | Declarative React components — the supported way to render. Start here.                  |
| [`@pitchkit/core`](./packages/core)     | Zero-dependency engine: coordinate systems, transforms, scene model, geometry, heatmaps. |

### Components

`<Pitch>` · `<VerticalPitch>` · `<Scatter>` · `<Annotate>` · `<Arrows>` · `<Comet>` ·
`<Heatmap>` · `<PositionalHeatmap>` · `<Hexbin>` · `<KDE>` · `<Polygon>` · `<ConvexHull>` ·
`<Voronoi>` · `<GoalAngle>` · `<Flow>` ·
`usePitch()`

Every visual prop takes either a static value or a function of the datum, so `fill="red"` and
`fill={(d) => d.teamColor}` are the same prop.

## Pitch types

`statsbomb` · `opta` · `uefa` — each with the provider's real coordinate space, so your data
goes in unmodified. `getPitchDimensions(type)` exposes the underlying numbers, and
`cropForHalf()` crops to the attacking half.

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

SVG marks server-render cleanly. Because layer components take accessor *functions* as props,
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

- **[pitchkitjs.com](https://pitchkitjs.com)** — guides, API reference, and the
  [gallery](https://pitchkitjs.com/gallery) (every card ships its full source).
- [docs/PRD.md](./docs/PRD.md) — product spec, architecture decisions and roadmap.

## Licence

[MIT](./LICENSE) © Yohahn Ribeiro
