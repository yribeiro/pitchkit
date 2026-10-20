---
"@pitchkit/core": minor
"@pitchkit/react": minor
---

Add `<PlayerAvatar>`, a player's photo, shirt number and name at a point on the pitch, with badges
for a yellow, second yellow or red card, a substitution on or off (a green or red square with a diagonal arrow, in or out), goals and assists. Counts show from
two up, and the badges are read out in words after the name.

It is HTML rather than SVG, so the photo can be any image component: pass `src` for a lazy-loaded
`<img>`, or nest `next/image` (or any other) as `children`, which fill a round `position: relative`
box. With no `size` it scales with the pitch, and `--pitch-avatar-size` sets it from CSS. `<Pitch>`
now stacks an HTML overlay layer over its `<svg>` for it to render into; like the Canvas layers, avatars
appear after hydration rather than in server-rendered HTML.

`@pitchkit/core` adds twelve theme tokens: `--pitch-avatar-size`, `--pitch-avatar-bg`,
`--pitch-avatar-ring`, `--pitch-avatar-text`, `--pitch-avatar-muted`, `--pitch-avatar-icon`,
`--pitch-avatar-icon-halo`, `--pitch-avatar-ball`, `--pitch-avatar-initials`, `--pitch-sub-on`,
`--pitch-sub-off` and `--pitch-sub-arrow`. The bundled Agent Skill documents
all of it.

`<Pitch>` now wraps its `<svg>`, the overlay and the tooltip in one inner box sized to its content box, so
HTML marks and the hover tooltip stay on their points when the pitch has padding or a border.
