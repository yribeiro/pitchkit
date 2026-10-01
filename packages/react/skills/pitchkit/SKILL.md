---
name: pitchkit
description: Builds football (soccer) pitch visualisations for the web with PitchKit, the @pitchkit/react, @pitchkit/core and @pitchkit/data-providers packages. Use when the request involves a shot map, pass map, pass network, pass flow, touch map, heatmap, hexbin, KDE surface, Voronoi, convex hull, or any other chart drawn on a football pitch in React or Next.js; when they want an xG race chart, xG timeline, xG flow chart, any cumulative/running-total chart over match minutes, a match momentum chart (momentum bars with goals and cards beneath), or a player radar chart; when the user names PitchKit, @pitchkit/react, @pitchkit/core, @pitchkit/data-providers or the Pitch component; when they mention StatsBomb, SkillCorner, Wyscout, Opta or UEFA pitch coordinates; when they want to load StatsBomb, SkillCorner or Wyscout open data (events, 360 freeze frames, broadcast tracking, dynamic events, phases of play); or when they ask for mplsoccer's behaviour on the web.
license: MIT
---

# PitchKit

PitchKit draws football pitches and the marks on them. It is mplsoccer's feature set
rebuilt for React, not a port of matplotlib.

This skill ships inside the installed `@pitchkit/react` tarball, so it describes the
exact version in the consuming project's `node_modules`. Check
`node_modules/@pitchkit/react/package.json` for that version before assuming any API
described here is present. Full docs: <https://www.pitchkitjs.com>.

## Never guess the API

There is no PitchKit in any model's training data. Anything recalled about it is
invented — usually mplsoccer's Python API in JSX clothing. Every component, prop and
export a PitchKit answer uses must come from this file, from
[references/api.md](references/api.md), or from the package's own `.d.ts`. If something
needed is not in those, say so rather than inventing it.

Things that do **not** exist, however plausible: a `<PassMap>` / `<ShotMap>` /
`<PassNetwork>` component, a `theme` prop or JS theme object, a `type="tracab"` (or
`"custom"`) pitch, a `responsive` prop, a `<Pitch>` `onClick` handler that
hands back pitch coordinates, an `<XgRace>` / `<XgTimeline>` / `<XgFlow>` component
(the cumulative chart is `<RaceChart>`, and `<Flow>` is an unrelated pitch layer for
binned pass direction), a `<Momentum>` / `<MatchMomentum>` component (it is
`<MomentumChart>`), a `<Radar>` (it is `<RadarChart>`) or a `<Pizza>` component (not built yet).

## Package split

| Package                    | What it is                                                             | When it's imported from                                                                 |
| -------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `@pitchkit/react`          | The rendering surface: `<Pitch>` + layer components + `usePitch()`     | Almost always                                                                           |
| `@pitchkit/core`           | Zero-dependency maths: pitch dimensions, transforms, geometry, binning | Only for helpers like `cropForHalf`, `getPitchDimensions`, `createStandardizeTransform` |
| `@pitchkit/data-providers` | Optional loaders for StatsBomb, SkillCorner and Wyscout **open data**  | Only when the user wants real match data rather than their own (recipe 5)               |

`@pitchkit/react` is the **only supported rendering surface**. `@pitchkit/core` exports
`svgRenderer` / `renderSceneToSVGElement`; those are internal building blocks for the
repo's own dev harness and must never appear in consumer code.

```bash
npm install @pitchkit/react
# add @pitchkit/core explicitly only when importing its helpers directly:
npm install @pitchkit/react @pitchkit/core
# data-providers is NOT pulled in by @pitchkit/react — install it deliberately:
npm install @pitchkit/data-providers
```

`@pitchkit/core` arrives transitively as a dependency of `@pitchkit/react`, but importing
from it without declaring it is a phantom dependency — declare it when it's imported.
`@pitchkit/data-providers` is not a dependency of either, so it is never already present:
tell the user to install it before writing an import from it.

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

| `type`          | Extent    | Origin      | y direction | Notes                      |
| --------------- | --------- | ----------- | ----------- | -------------------------- |
| `"statsbomb"`   | 120 × 80  | top-left    | down        | Abstract units             |
| `"opta"`        | 100 × 100 | bottom-left | up          | Normalised percentage grid |
| `"uefa"`        | 105 × 68  | bottom-left | up          | Real metres                |
| `"skillcorner"` | 105 × 68  | center      | up          | Real metres, centre origin |
| `"wyscout"`     | 100 × 100 | top-left    | down        | Normalised percentage grid |

`"wyscout"` is **not** `"opta"` under another name, even though both are
0–100 on both axes: Wyscout's origin is top-left with y increasing downward,
Opta's is bottom-left with y increasing upward. Plotting one on the other
mirrors the pitch vertically and nothing errors, because every coordinate is
still in range.

`"skillcorner"` is the only centre-origin type: x runs `-52.5` to `+52.5`, so
data from `@pitchkit/data-providers/skillcorner` plots with its raw `x`/`y`
and needs no conversion. Their pitches are really 104–106 m, so pass the
match's own size when you want the touchlines exact — markings don't move,
since a penalty area is 16.5 m deep on any pitch:

```tsx
<Pitch type="skillcorner" dimensions={{ length: match.pitch_length, width: match.pitch_width }} />
```

Those five are the whole list. For a provider that isn't one of them, standardise the
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

Non-pitch charts — separate roots, **not** children of `<Pitch>`:

`<RaceChart>` — a cumulative step chart over match minutes. This is what an "xG race
chart", "xG timeline" or "xG flow chart" means. `useRaceChart()` returns
`{ frame, scaleX, scaleY, series, endTime, valueAt }`.

`<MomentumChart>` — match momentum as signed bars per half with an event icon row (goals,
cards, substitutions, VAR). `useMomentumChart()` returns `{ frame, panels, scaleX, scaleY, bars }`.

`<RadarChart>` — the player radar, one axis per metric. `useRadarChart()` returns `{ cx, cy, inner,
outer, angleOf, pointAt }`. None takes a `type` prop: there is no pitch to have a provider.

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
| `--pitch-marker-goal`    | `<GoalAngle>` wedge fill        | `#f97316`                   |
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

This is the pattern for **all four** density layers (`<Heatmap>`, `<PositionalHeatmap>`,
`<Hexbin>`, `<KDE>`). They paint to a `<canvas>` after hydration, so they need an explicit
pixel size and a `ResizeObserver` to stay responsive — unlike every SVG layer, which just
works. The full copy-paste version is in
[references/api.md](references/api.md#the-responsive-canvas-pattern).

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

## Recipe 5 — xG race chart (the non-pitch root)

`<RaceChart>` accumulates a per-event value against the clock. No `<Pitch>` anywhere.

```tsx
// shots: { minute, team, xg, goal, period }[]
<RaceChart
  series={["Spain", "England"].map((id) => ({ id, data: shots.filter((s) => s.team === id) }))}
  time={(s) => s.minute}
  value={(s) => s.xg}
  emphasise={(s) => s.goal}
  period={(s) => s.period}
/>
```

Easy to get wrong: filter `period <= 4` (period 5 is the shootout and carries xG), pass
`period` rather than hardcoding half time, and draw bookings as children via
`useRaceChart()`. Details: [references/api.md](references/api.md#racechart).

Chart theming is variables: `--pitch-series-1` … `-6`, `--pitch-axis`, `--pitch-grid`,
`--pitch-chart-*`. A series `className` such as `text-rose-500` replaces its default.

## Recipe 5b — match momentum and radar (the other non-pitch roots)

Neither computes its numbers: momentum (+ home, − away) and radar values come from the caller.

```tsx
<MomentumChart
  periods={[firstHalf, secondHalf]} // [{ minute, value }]
  time={(d) => d.minute}
  value={(d) => d.value}
  events={events} // with eventTime / eventSide / eventKind, as a set
  eventTime={(e) => e.minute}
  eventSide={(e) => e.side}
  eventKind={(e) => e.kind} // goal, yellow-card, red-card, ...
/>

<RadarChart
  metrics={[{ id: "npxg", label: "npxG", min: 0, max: 0.34 }, /* ≥ 3 */
    { id: "to", label: "Turnovers", min: 0, max: 4.4, lowerIsBetter: true }]}
  series={[{ id: "yamal", label: "Yamal", values: { npxg: 0.28, to: 4.2 } }]} // ≤ 3 series
  renderDetail={({ metric, values, close }) => <Breakdown metric={metric} />} // labels → buttons
/>
```

Momentum: keep icons to goals and cards. Radar ranges are usually the population's 5th–95th
percentile. Details: [momentum](references/api.md#momentumchart), [radar](references/api.md#radarchart).

## Recipe 6 — real open data

Only when the user wants **real matches** rather than their own data. Requires the separate
`npm install @pitchkit/data-providers`; it is not a dependency of `@pitchkit/react`.

Three providers, each on its own import subpath, each keeping that provider's own field
names and values — a StatsBomb outcome is `"Off T"`, not a re-spelled `"off-target"`.

```tsx
"use client";

import { fetchMatchEvents, isGoal, shots } from "@pitchkit/data-providers/statsbomb";
import { Scatter, VerticalPitch } from "@pitchkit/react";

// One call, match id in: 3943043 is the Euro 2024 final.
const events = await fetchMatchEvents(3943043);
const spain = shots(events).filter((shot) => shot.team.name === "Spain");

<VerticalPitch type="statsbomb">
  <Scatter
    data={spain}
    x={(shot) => shot.x}
    y={(shot) => shot.y}
    r={(shot) => 3 + Math.sqrt(shot.shot.statsbomb_xg) * 11}
    fill={(shot) => (isGoal(shot) ? "#fb923c" : "#38bdf8")}
  />
</VerticalPitch>;
```

Four layers, each usable alone: `parse*` (pure, no network), `fetch*`/`load*` (network —
`fetch*` builds the open-data URL from an id, `load*` takes any URL), narrowing selectors
(`shots`, `passes`, `carries`, `ofType`), and composable predicates (`isGoal`,
`isComplete`, `isCorner`, …) that chain off `.filter()`.

**Narrowing goes through the selectors and guards, never through `event.type.name`.**
StatsBomb's discriminant is nested inside `type`, and TypeScript only narrows on
_top-level_ literal discriminants — so `if (event.type.name === "Shot") event.shot` runs
correctly but fails to typecheck. Use `shots(events)` or `isShot(event)`.

Coordinates: StatsBomb's `location` arrays are surfaced as lifted `x`/`y` (and
`endX`/`endY`/`endZ`) for accessors, and Wyscout's `positions` the same way. SkillCorner's are
already metres from the centre spot, so `<Pitch type="skillcorner">` plots them raw.
`<Pitch type="wyscout">` also plots raw, but its `x` is normalised to the attacking direction
(positive always points at the goal being attacked) — the same convention as SkillCorner's
dynamic events, and the opposite of its tracking file.

```ts
import { fetchMatch, offBallRuns, streamTracking } from "@pitchkit/data-providers/skillcorner";

const match = await fetchMatch(1874553);

// Tracking is ~90 MB a match. streamTracking is an async generator, so leaving
// the loop aborts the download — take a clip rather than the file.
const frames = [];
for await (const frame of streamTracking(match)) {
  if (frame.period === null || frame.player_data.length === 0) continue;
  frames.push(frame);
  if (frames.length >= 300) break;
}
```

Two SkillCorner traps worth knowing before plotting: tracking coordinates are **absolute**
and swap ends at half time, while dynamic-event coordinates are **normalised to the
attacking direction** and never flip — mixing them mirrors half a match silently. And
`is_detected: false` means the position was extrapolated, not seen, because broadcast
tracking only covers what the camera framed.

```ts
import { fetchMatch, isGoal, shotGoalZone, shots } from "@pitchkit/data-providers/wyscout";

const match = await fetchMatch(2499943); // Liverpool 4–3 Manchester City, 2018
const goals = shots(match.events).filter(isGoal);
```

`fetchMatch` returns events and both squads in one call; there's no `fetchMatches` since
Wyscout's mirror publishes no match index, only a Markdown table.

Two Wyscout traps: **a goal is tagged on the conceding keeper's save as well as the shot that
scored it** (measured: 15 shots, 19 save attempts, 3 free kicks all carry it), so filter
`shots(events)` before `isGoal`, not the whole feed. And **a shot has no end coordinate** —
`positions[1]` is a placeholder on every `Shot`/`Interruption`/`Offside`; `shotGoalZone(shot)`
reads where it went instead, from a goal-mouth tag. Almost everything else is a tag too:
`hasTag`, `WYSCOUT_TAGS`, and predicates like `isAccurate`/`wonDuel` built on it.

None of the three providers' data ships with the package — it is fetched from their open-data
repositories (Wyscout's from a mirror), and **all three ask to be credited** in anything
published from it.

## Where to look next

- [references/api.md](references/api.md) — every component's full prop list, plus the
  `@pitchkit/core` exports worth calling directly.
- <https://www.pitchkitjs.com/docs/data> — the data loaders in depth, per provider and file.
- <https://www.pitchkitjs.com/docs> — narrative guides; <https://www.pitchkitjs.com/gallery> — worked examples.
- The installed package's `dist/index.d.ts` — the authoritative types.
