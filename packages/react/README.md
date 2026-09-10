# @pitchkit/react

[![npm](https://img.shields.io/npm/v/@pitchkit/react)](https://www.npmjs.com/package/@pitchkit/react)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/yribeiro/pitchkit/blob/main/LICENSE)

Declarative React components for football pitch visualisation — mplsoccer's feature set for
the web. Responsive by default, themed with CSS variables, SSR-safe.

**Docs and live examples: [pitchkitjs.com](https://pitchkitjs.com)**

> **Early days.** `0.1.x` is the first public release. Usable and tested, but the API isn't
> stable yet — expect breaking changes before `1.0`.

## Install

```bash
npm install @pitchkit/react
```

React >= 18 is a peer dependency. [`@pitchkit/core`](https://www.npmjs.com/package/@pitchkit/core)
is installed automatically.

## Usage

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

`<Pitch>` owns the coordinate system; children are layers drawn into it, stacked in render
order. Every visual prop accepts a static value **or** a function of the datum — `fill="red"`
and `fill={(d) => d.teamColor}` are the same prop.

## Components

| Component          | Draws                                                       |
| ------------------ | ----------------------------------------------------------- |
| `<Pitch>`          | The pitch surface + coordinate context (horizontal)         |
| `<VerticalPitch>`  | Same, rotated to a vertical framing                         |
| `<Scatter>`        | Circles — shots, players, events                            |
| `<Annotate>`       | Text labels                                                 |
| `<Arrows>`         | Straight arrows — passes, carries                           |
| `<Comet>`          | Tapered lines with direction implied by width               |
| `<Heatmap>`        | Binned density on Canvas (client-only)                      |
| `<PositionalHeatmap>` | Juego de Posición zone density on Canvas (client-only)   |
| `<Hexbin>`         | Hexagonal density on Canvas (client-only)                   |
| `<KDE>`            | Smooth kernel density surface on Canvas (client-only)       |
| `<Polygon>`        | Arbitrary closed shapes                                     |
| `<ConvexHull>`     | Convex hull of a point set                                  |
| `<Voronoi>`        | Voronoi cells, clipped to the pitch                         |
| `<GoalAngle>`      | The angle-to-goal wedge from a shot location                |
| `<Flow>`           | Binned direction + magnitude vectors                        |
| `usePitch()`       | Hook exposing the pixel transform for custom SVG            |

## Sizing

Responsive is the default — with no size props the pitch fills its container via
`ResizeObserver` and recomputes on resize. Explicit sizing is the opt-out:

```tsx
<Pitch type="statsbomb" />                          {/* fills container */}
<Pitch type="statsbomb" width={1200} height={800} /> {/* fixed — exports, OG images */}
```

## Layer order

Markings paint *below* the layer children by default, so discrete marks sit on top of the
lines. An opaque density fill will therefore cover them — set `appearance.linesOnTop` to paint
the markings above instead (mplsoccer's `line_zorder`):

```tsx
<Pitch type="statsbomb" appearance={{ linesOnTop: true }}>
  <KDE data={touches} x={(t) => t.x} y={(t) => t.y} />
</Pitch>
```

Only the markings move — the grass surface and stripes stay at the bottom either way.

## Pitch types

`statsbomb` · `opta` · `uefa`, each using the provider's real coordinate space so event data
goes in unmodified.

```tsx
import { cropForHalf, getPitchDimensions } from "@pitchkit/core";

const dimensions = getPitchDimensions("statsbomb");

<VerticalPitch type="statsbomb" crop={cropForHalf(dimensions)}>{/* … */}</VerticalPitch>
```

## Theming

CSS variables only — no theme objects, no providers. Define once; every chart inherits,
including dark mode:

```css
:root {
  --pitch-surface: #1a472a;
  --pitch-stripe: #1d4f30;
  --pitch-lines: rgba(255, 255, 255, 0.8);
}
```

Marks accept `className`, so Tailwind works directly:

```tsx
<Scatter data={shots} x={(s) => s.x} y={(s) => s.y} className="fill-emerald-400 stroke-white" />
```

Setting `className` without an explicit `fill`/`stroke` makes the mark drop its themed default
so your class wins. For marks whose JSX you don't own, every element carries
`data-pitchkit-mark` / `-layer` / `-part` attributes to target instead.

## Next.js / SSR

SVG marks server-render cleanly. Because layer components take accessor *functions* as props,
the `<Pitch>` tree must originate inside a `"use client"` component — React Server Components
can't pass functions across the client boundary. SSR still happens; only the prop-serialisation
boundary moves. `<Heatmap>` is Canvas-backed and therefore client-only.

## Agent Skill

No model has PitchKit in its training data, so coding agents asked for a shot map tend to
invent an mplsoccer-flavoured API. This package ships an Agent Skill — `skills/pitchkit/`
inside the tarball — that documents the real one.

```bash
npx @pitchkit/react skills install          # -> .claude/skills/pitchkit/
npx @pitchkit/react skills install --dir .cursor/skills
npx @pitchkit/react skills path             # where it lives in node_modules
```

Install *symlinks* the target at the copy inside `node_modules`, so `npm update
@pitchkit/react` moves the skill with it and an agent can't end up reading last version's
API. On a filesystem that won't take a symlink it copies instead and says so — that copy is
a snapshot, so re-run with `--force` after upgrading.

The default directory suits Claude Code; for any other agent, point `--dir` at wherever it
reads skills from, or hand it the `skills path` output to read directly. The layout follows
the `skills/<name>/SKILL.md` convention, so generic installers like `skills-npm` find it in
`node_modules` without needing this CLI at all.

## Links

- [Documentation & gallery](https://pitchkitjs.com)
- [Repository](https://github.com/yribeiro/pitchkit)
- [Issues](https://github.com/yribeiro/pitchkit/issues)
- [`@pitchkit/core`](https://www.npmjs.com/package/@pitchkit/core) — the framework-agnostic engine

## Licence

MIT © Yohahn Ribeiro
