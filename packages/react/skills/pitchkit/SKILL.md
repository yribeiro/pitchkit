---
name: pitchkit
description: Builds football (soccer) pitch visualisations for the web with PitchKit, the @pitchkit/react and @pitchkit/core packages. Use when the request involves a shot map, pass map, pass network, pass flow, touch map, heatmap, hexbin, KDE surface, Voronoi, convex hull, or any other chart drawn on a football pitch in React or Next.js; when the user names PitchKit, @pitchkit/react, @pitchkit/core or the Pitch component; when they mention StatsBomb, Opta or UEFA pitch coordinates; or when they ask for mplsoccer's behaviour on the web.
license: MIT
---

# PitchKit

PitchKit draws football pitches and the marks on them. It is mplsoccer's feature set
rebuilt for React, not a port of matplotlib.

This skill ships inside the installed `@pitchkit/react` tarball, so it describes the
exact version in the consuming project's `node_modules`. Check
`node_modules/@pitchkit/react/package.json` for that version before assuming any API
described here is present. Full docs: <https://pitchkitjs.com>.

## Never guess the API

There is no PitchKit in any model's training data. Anything recalled about it is
invented — usually mplsoccer's Python API in JSX clothing. Every component, prop and
export a PitchKit answer uses must come from this file, from
[references/api.md](references/api.md), or from the package's own `.d.ts`. If something
needed is not in those, say so rather than inventing it.

Things that do **not** exist, however plausible: a `<PassMap>` / `<ShotMap>` /
`<PassNetwork>` component, a `theme` prop or JS theme object, a `type="wyscout"` (or
`"tracab"`, `"skillcorner"`, `"custom"`) pitch, a `responsive` prop, a `<Pitch>`
`onClick` handler that hands back pitch coordinates.

## Package split

| Package           | What it is                                                             | When it's imported from                                                                 |
| ----------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `@pitchkit/react` | The rendering surface: `<Pitch>` + layer components + `usePitch()`     | Almost always                                                                           |
| `@pitchkit/core`  | Zero-dependency maths: pitch dimensions, transforms, geometry, binning | Only for helpers like `cropForHalf`, `getPitchDimensions`, `createStandardizeTransform` |

`@pitchkit/react` is the **only supported rendering surface**. `@pitchkit/core` exports
`svgRenderer` / `renderSceneToSVGElement`; those are internal building blocks for the
repo's own dev harness and must never appear in consumer code.

```bash
npm install @pitchkit/react
# add @pitchkit/core explicitly only when importing its helpers directly:
npm install @pitchkit/react @pitchkit/core
```

`@pitchkit/core` arrives transitively as a dependency of `@pitchkit/react`, but importing
from it without declaring it is a phantom dependency — declare it when it's imported.

## The five rules

1. **Data goes in in its provider's own units.** Never pre-scale coordinates. Set `type`
   on `<Pitch>` and pass raw StatsBomb / Opta / UEFA numbers straight through.
2. **Every visual prop is an accessor:** a constant (`r={5}`) or a function of the datum
   (`r={(s) => 3 + s.xg * 9}`). Same prop name for both forms.
3. **Layer components must be descendants of `<Pitch>`.** They read the pixel transform
   from context and throw if rendered outside one.
4. **Responsive is the default.** A `<Pitch>` fills its container and keeps the pitch
   aspect ratio, so sizing a pitch means sizing its parent. Passing `width` _and_
   `height` is the opt-out — pass both or neither.
5. **Theming is CSS variables only.** There is no theme object and no colour props on
   `<Pitch>`.

## Pitch types

| `type`        | Extent    | Origin      | y direction | Notes                      |
| ------------- | --------- | ----------- | ----------- | -------------------------- |
| `"statsbomb"` | 120 × 80  | top-left    | down        | Abstract units             |
| `"opta"`      | 100 × 100 | bottom-left | up          | Normalised percentage grid |
| `"uefa"`      | 105 × 68  | bottom-left | up          | Real metres                |

Those three are the whole list. For a provider that isn't one of them, standardise the
data first and render in the target grid:

```tsx
import { createStandardizeTransform, getPitchDimensions } from "@pitchkit/core";

const optaToStatsBomb = createStandardizeTransform(
  getPitchDimensions("opta"),
  getPitchDimensions("statsbomb"),
);
const [x, y] = optaToStatsBomb([50, 50]); // -> [60, 40]
```

## Components

SVG layers — server-renderable, one element per datum, all accept `className` and a
`tooltip` accessor:

`<Scatter>` `<Annotate>` `<Arrows>` `<Comet>` `<Polygon>` `<ConvexHull>` `<Voronoi>`
`<GoalAngle>` `<Flow>`

Canvas density layers — client-only, accept `className` and `style` but **no** `tooltip`:

`<Heatmap>` `<PositionalHeatmap>` `<Hexbin>` `<KDE>`

Roots: `<Pitch>`, and `<VerticalPitch>` (exactly `<Pitch orientation="vertical">`).
Escape hatch: `usePitch()` returns `{ dimensions, viewport, transform }` for custom marks.

Full prop tables for every component are in [references/api.md](references/api.md) — read
it before writing props not shown in the recipes below.

## Composite charts are compositions, not components

A shot map is `<VerticalPitch>` + a crop + `<Scatter>`. A pass network is `<Arrows>` +
`<Scatter>` + `<Annotate>` over data the caller aggregated. PitchKit ships primitives; the
aggregation is ordinary JavaScript. Build these from the recipes below.

(The project intends to distribute such compositions as shadcn registry items later. That
registry does not exist yet — do not tell a user to run `npx shadcn add pass-map`.)

## Gotchas that break builds

**Next.js App Router: originate the tree in a `"use client"` component.** Accessors are
functions, and React Server Components cannot pass functions to client components. A
`<Pitch>` tree written directly in a server page fails `next build` with _"Functions
cannot be passed directly to Client Components"_. Compose it in a `"use client"` component
and render that from the page — it is still fully server-rendered into the initial HTML.

**Density layers need a fixed-pixel pitch.** `<Heatmap>` / `<PositionalHeatmap>` /
`<Hexbin>` / `<KDE>` paint to a `<canvas>`, which needs real pixel dimensions and cannot
use the SVG's responsive viewBox. Give `<Pitch>` explicit `width` and `height` — measure
the container with a `ResizeObserver` to stay responsive (recipe 3 below).

**Density layers hide the pitch markings.** They fill opaquely from `colorMin` to
`colorMax`, including empty bins. Pass `appearance={{ linesOnTop: true }}` so the markings
paint above them (mplsoccer's `line_zorder`), and/or drop the layer's opacity via `style`.

**`className` turns the themed colour default off.** Colour defaults are applied as inline
styles, which would otherwise beat a utility class at the same property. So passing
`className` to an SVG layer means it owns `fill` / `stroke` — either style them there, or
pass `fill` / `stroke` explicitly.

**Canvas layers render nothing on the server.** That is by design; they paint after
hydration. The pitch and the SVG layers around them still SSR.

## Theming

Set CSS custom properties anywhere in the cascade — globally, on `.dark`, or on a wrapper
around a single chart. Every variable has a built-in fallback, so none is required.

| Variable                 | Controls                        | Default                     |
| ------------------------ | ------------------------------- | --------------------------- |
| `--pitch-surface`        | Grass fill                      | `#1a472a`                   |
| `--pitch-stripe`         | Mow-stripe overlay              | `rgba(255, 255, 255, 0.04)` |
| `--pitch-lines`          | Markings, and `<Annotate>` text | `rgba(255, 255, 255, 0.8)`  |
| `--pitch-line-width`     | Marking stroke width            | `1.5`                       |
| `--pitch-marker-primary` | Default mark colour             | `#3b82f6`                   |
| `--pitch-tooltip-bg`     | Tooltip background              | `rgba(17, 17, 17, 0.92)`    |
| `--pitch-tooltip-color`  | Tooltip text                    | `#fff`                      |

`@pitchkit/core` exports `pitchTokens` as a typo-safe map of those names; the values
always live in CSS.

`appearance` is structure, never colour: `{ stripes, goalType, linesOnTop }`.

```tsx
<div style={{ "--pitch-surface": "#101418" } as React.CSSProperties}>
  <Pitch type="statsbomb" appearance={{ stripes: true, goalType: "box" }} />
</div>
```

## Recipe 1 — shot map

Attacking half, vertical framing, markers sized by xG and coloured by outcome.

```tsx
"use client";

import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import { Scatter, VerticalPitch } from "@pitchkit/react";

// StatsBomb coordinates: 120 x 80, origin top-left, y increasing downward.
const shots = [
  { x: 112, y: 39, xg: 0.76, outcome: "goal" },
  { x: 105, y: 44, xg: 0.31, outcome: "saved" },
  { x: 99, y: 47, xg: 0.13, outcome: "off target" },
  { x: 91, y: 29, xg: 0.06, outcome: "off target" },
];

const dimensions = getPitchDimensions("statsbomb");

export function ShotMap() {
  return (
    <VerticalPitch type="statsbomb" crop={cropForHalf(dimensions)}>
      <Scatter
        data={shots}
        x={(s) => s.x}
        y={(s) => s.y}
        r={(s) => 3 + s.xg * 9}
        fill={(s) => (s.outcome === "goal" ? "#fb923c" : "#38bdf8")}
        fillOpacity={(s) => (s.outcome === "goal" ? 0.95 : 0.65)}
        stroke="white"
        strokeWidth={(s) => (s.outcome === "goal" ? 2 : 1)}
        tooltip={(s) => `${s.outcome} · xG ${s.xg.toFixed(2)}`}
      />
    </VerticalPitch>
  );
}
```

`crop` takes any `{ x0, y0, x1, y1 }` window in provider units; `cropForHalf` is the
convenience for the attacking half. The container's aspect ratio follows the crop, so a
half-pitch crop reserves space for half a pitch.

## Recipe 2 — pass map

Individual passes, tapered from origin to destination and coloured by completion.

```tsx
"use client";

import { Comet, Pitch } from "@pitchkit/react";

const passes = [
  { x: 22, y: 30, x2: 48, y2: 18, completed: true },
  { x: 48, y: 18, x2: 71, y2: 26, completed: true },
  { x: 71, y: 26, x2: 96, y2: 40, completed: false },
  { x: 35, y: 55, x2: 62, y2: 62, completed: true },
];

export function PassMap() {
  return (
    <Pitch type="statsbomb">
      <Comet
        data={passes}
        x={(p) => p.x}
        y={(p) => p.y}
        x2={(p) => p.x2}
        y2={(p) => p.y2}
        color={(p) => (p.completed ? "#38bdf8" : "#f87171")}
        startWidth={0.5}
        endWidth={4}
        gradient
        tooltip={(p) => (p.completed ? "Completed" : "Incomplete")}
      />
    </Pitch>
  );
}
```

Swap `<Comet>` for `<Arrows>` when a flat line with an arrowhead reads better; `<Arrows>`
takes `strokeWidth` / `strokeOpacity` / `headSize` instead of the taper widths. For passes
aggregated by starting zone into one arrow per zone (mplsoccer's `flow`), use `<Flow>` with
`binsX` / `binsY` — its `tooltip` receives a `FlowBin` (`{ x, y, x2, y2, count }`), not a
raw datum.

## Recipe 3 — heatmap (the responsive-canvas pattern)

This is the pattern for **all four** density layers. Copy it whenever one is used.

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Heatmap, Pitch } from "@pitchkit/react";

const events = [
  { x: 52, y: 22 },
  { x: 55, y: 18 },
  { x: 61, y: 20 },
  { x: 66, y: 23 },
  { x: 74, y: 22 },
  { x: 59, y: 43 },
  { x: 47, y: 52 },
  { x: 82, y: 24 },
];

const PITCH_ASPECT = 120 / 80; // statsbomb length / width

export function PressureHeatmap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(480);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      <Pitch
        type="statsbomb"
        width={width}
        height={Math.round(width / PITCH_ASPECT)}
        appearance={{ linesOnTop: true }}
      >
        <Heatmap
          data={events}
          x={(e) => e.x}
          y={(e) => e.y}
          binsX={12}
          binsY={8}
          colorMin="#0f3d24"
          colorMax="#38bdf8"
          style={{ opacity: 0.85 }}
        />
      </Pitch>
    </div>
  );
}
```

Same shape for the variants: `<PositionalHeatmap layout="full" />` for Juego de Posición
zones, `<Hexbin binsX={14} />` for a hex lattice, `<KDE resolution={64} maxOpacity={0.8} />`
for a smooth surface. Every one of them takes an optional `weight` accessor — omit it to
count points per bin, provide it to sum a value (total xG per zone, say).

## Recipe 4 — pass network

Node size = touches, edge width = passes between the pair. The aggregation is plain data
prep; the pitch just draws the result.

```tsx
"use client";

import { Annotate, Arrows, Pitch, Scatter } from "@pitchkit/react";

const players = [
  { id: "GK", x: 10, y: 40, touches: 42 },
  { id: "LCB", x: 26, y: 30, touches: 71 },
  { id: "RCB", x: 26, y: 50, touches: 66 },
  { id: "DM", x: 44, y: 40, touches: 88 },
  { id: "ST", x: 92, y: 40, touches: 38 },
];

const byId = Object.fromEntries(players.map((p) => [p.id, p]));
const node = (id: string) => {
  const player = byId[id];
  if (!player) throw new Error(`Unknown player id: ${id}`);
  return player;
};

const passes = [
  { from: "GK", to: "LCB", count: 18 },
  { from: "GK", to: "RCB", count: 15 },
  { from: "LCB", to: "DM", count: 24 },
  { from: "DM", to: "ST", count: 9 },
];

export function PassNetwork() {
  return (
    <Pitch type="statsbomb">
      <Arrows
        data={passes}
        x={(p) => node(p.from).x}
        y={(p) => node(p.from).y}
        x2={(p) => node(p.to).x}
        y2={(p) => node(p.to).y}
        strokeWidth={(p) => 0.5 + p.count / 6}
        strokeOpacity={(p) => 0.3 + Math.min(p.count / 30, 0.6)}
        headSize={0}
        tooltip={(p) => `${p.from} → ${p.to}: ${p.count} passes`}
      />
      <Scatter
        data={players}
        x={(p) => p.x}
        y={(p) => p.y}
        r={(p) => 4 + p.touches / 12}
        stroke="white"
        strokeWidth={1.5}
        tooltip={(p) => `${p.id} · ${p.touches} touches`}
      />
      <Annotate data={players} x={(p) => p.x} y={(p) => p.y} label={(p) => p.id} offsetY={-14} />
    </Pitch>
  );
}
```

Layer order is paint order: arrows first, then nodes, then labels on top.

## Where to look next

- [references/api.md](references/api.md) — every component's full prop list, plus the
  `@pitchkit/core` exports worth calling directly.
- <https://pitchkitjs.com/docs> — narrative guides.
- <https://pitchkitjs.com/gallery> — worked examples with source.
- The installed package's `dist/index.d.ts` — the authoritative types.
