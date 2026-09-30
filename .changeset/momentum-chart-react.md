---
"@pitchkit/react": minor
---

Add `<MomentumChart>` and `useMomentumChart()` — match momentum as signed bars, one panel per
period, with an icon row of events beneath.

Like `<RaceChart>` it is a root, not a pitch layer, and takes no `type` prop. `periods` takes
one array of samples per period (extra time is two more), at any interval: each bar runs from its
sample to the next one's minute. `value` is signed, positive for the home side and negative for the
away side. A period's width follows its minutes, so stoppage time widens a half.

Events are passed as `events` with `eventTime`, `eventSide` and `eventKind` accessors, like every
other prop. The kinds are `goal`, `own-goal`, `missed-penalty`, `yellow-card`, `red-card`,
`substitution` and `var`; the icons are PitchKit's own. The icon row is one row: icons that would
touch stack with an offset, so a dense list such as every substitution is better left out or
drawn as children.

`useMomentumChart()` exposes `frame`, `panels`, `scaleX`, `scaleY` and `bars` so anything else can
be drawn as a child. Development builds warn when two periods are sampled at different intervals, since the halves then draw bars of different widths. Hover and touch readouts work as for `<RaceChart>`, whose readout card is now
shared.

The bundled Agent Skill documents both, and PitchKit does not compute momentum — the values come
from the caller.
