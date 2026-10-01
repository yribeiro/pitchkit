---
"@pitchkit/core": minor
---

Add the polar maths `<RadarChart>` is built on, in a new `polar/` module: `axisAngle`,
`polarPoint`, `normaliseMetric` (range, lower-is-better flip and clamp), `ringValues`,
`labelPlacement` and `wrapLabel`, with the `PolarRange`, `NormalisedValue`, `LabelRotation` and
`LabelPlacement` types and `LABEL_LINE_HEIGHT`.

Like `chart/`, `race/` and `momentum/`, it takes plain numbers, has no dependency on the pitch
modules, and is held at 100% coverage.
