---
"@pitchkit/core": minor
---

Add the polar maths `<RadarChart>` is built on, in a new `polar/` module: `axisAngle`,
`nearestAxis`, `polarPoint`, `normaliseMetric` (range, lower-is-better flip and clamp),
`ringSteps`, `ringValues`, `ringPath`, `labelPlacement`, `labelMargin`, `labelBox`, `textWidth`
and `wrapLabel`, with the `PolarRange`, `NormalisedValue`, `LabelRotation` and `LabelPlacement`
types and the `LABEL_LINE_HEIGHT` and `GLYPH_WIDTH` constants.

`pitchTokens` gains `tooltipBg` and `tooltipColor`, the two tooltip variables it was missing.

Like `chart/`, `race/` and `momentum/`, it takes plain numbers, has no dependency on the pitch
modules, and is held at 100% coverage.
