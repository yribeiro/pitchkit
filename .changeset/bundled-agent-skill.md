---
"@pitchkit/react": minor
---

Ship an Agent Skill inside the published package, so coding agents get PitchKit's real API
instead of inventing an mplsoccer-flavoured one.

- `skills/pitchkit/SKILL.md` — the mental model (package split, provider coordinate
  systems, accessors, responsive-by-default, CSS-variable theming), the gotchas that break
  builds (the `"use client"` boundary, density layers needing a fixed-pixel pitch), and
  four complete worked recipes: shot map, pass map, heatmap, pass network.
- `skills/pitchkit/references/api.md` — full prop tables for every component plus the
  `@pitchkit/core` exports worth calling directly.
- A new `pitchkit` bin: `npx @pitchkit/react skills install [--dir <path>] [--force]`
  copies the skill into a consuming project (default `.claude/skills/`), and
  `npx @pitchkit/react skills path` prints its location in `node_modules`.

Because the skill travels in the tarball it always describes the installed version, which
`llms.txt`-style docs can't do.
