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
progress notes). Every `@pitchkit/core` item is done and merged (pitch styling/theming,
SVG mark layers, Canvas heatmap). `@pitchkit/react` bindings (`<Pitch>`, layer components,
`<Heatmap>`, tooltips, `usePitch()`) are done, on branch `milestone-1-react-bindings` /
[PR #5](https://github.com/yribeiro/pitchkit/pull/5) (open). Remaining Milestone 1 scope:
docs site skeleton, first npm publish.
