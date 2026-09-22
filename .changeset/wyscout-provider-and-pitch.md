---
"@pitchkit/data-providers": minor
"@pitchkit/core": minor
"@pitchkit/react": minor
---

Wyscout open data, and a `wyscout` pitch type.

`@pitchkit/data-providers/wyscout` loads the Pappalardo et al. dataset — 1,941
matches across the 2017/18 big-five leagues plus World Cup 2018 and Euro 2016,
CC BY 4.0. `fetchMatch(id)` returns the events with both squads attached;
`shots`/`passes`/`duels` narrow the feed, and Wyscout's numeric tags are read
through `hasTag` and named predicates (`isGoal`, `isAccurate`, `wonDuel`, …).

`core` gains the `"wyscout"` pitch type, widening the public `PitchTypeId`
union — additive for callers, but an exhaustive `switch` over it gains a case.

It also fixes a long-standing rendering bug: a normalized 0-100 grid now
derives its shape from `realLengthMeters`/`realWidthMeters` rather than from
`length`/`width`, so Opta and Wyscout render as 105:68 rectangles instead of
squares. StatsBomb, UEFA and SkillCorner are unaffected — their unit scale is
1 on both axes and their output is byte-identical.
