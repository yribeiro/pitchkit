---
"@pitchkit/core": minor
---

Add the maths `<MomentumChart>` is built on, in a new `momentum/` module: `computeMomentumBars`,
`barAtMinute`, `nominalPeriodRange`, `resolvePeriodRange`, `layoutMomentumPanels`,
`momentumExtent` and `assignLanes`, with the `MomentumSample`, `MomentumBar`, `MomentumRange`
and `MomentumPanel` types.

Like `chart/` and `race/`, it takes plain numbers and has no dependency on `dimensions/`,
`transform/` or `scene/`, and is held at 100% coverage.

Also adds `--pitch-card-yellow` and `--pitch-card-red` to `pitchTokens`.
