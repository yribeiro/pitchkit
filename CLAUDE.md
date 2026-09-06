# PitchKit

TypeScript-native football pitch visualisation library (mplsoccer for the web).

Full PRD: see `docs/PRD.md` — read this before any architectural work.

## Key decisions already made

- Hybrid SVG (interactive marks) + Canvas (heatmaps/KDE) rendering
- Monorepo: npm workspaces + Turborepo, packages under `@pitchkit/*`
- `@pitchkit/core` has zero React dependency; `@pitchkit/react` is a thin binding
- Theming = CSS variables only (shadcn-style), no JS theme objects
- Responsive is the default (no prop); explicit width/height is the opt-out
- Distribution: engine via npm, recipes/themes via shadcn registry

## Current phase

Milestone 1 — MVP, in progress (see PRD roadmap section 11 for the full checklist and
progress notes). Every `@pitchkit/core` and `@pitchkit/react` item is done and merged
(pitch styling/theming, SVG mark layers, Canvas heatmap, `<Pitch>`, layer components,
`<Heatmap>`, tooltips, `usePitch()`), including review apps `examples/react-vite/` and
`examples/react-nextjs/` (Next.js App Router SSR verification) —
[PR #5](https://github.com/yribeiro/pitchkit/pull/5) merged into `main`.
Remaining Milestone 1 scope: docs site skeleton, shadcn-style showcase website, and
[issues #6](https://github.com/yribeiro/pitchkit/issues/6)/[#7](https://github.com/yribeiro/pitchkit/issues/7).
npm publish and repo-hygiene/release tooling were moved out of Milestone 1 into a new
**Milestone 3 — publishing**, run as one concentrated effort after Milestone 2's parity
push (see PRD roadmap section 11).
