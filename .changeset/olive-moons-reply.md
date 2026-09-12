---
"@pitchkit/data-providers": minor
---

Add `@pitchkit/data-providers/skillcorner`, a loader for
[SkillCorner's open data](https://github.com/SkillCorner/opendata) — 20 A-League
2024/25 matches of broadcast tracking, plus their derived dynamic events and
phases of play.

Same shape as the StatsBomb module: pure `parse*`, networked `fetch*`,
narrowing selectors (`playerPossessions`, `passingOptions`, `offBallRuns`,
`onBallEngagements`) and composable predicates. SkillCorner's own field names
and values are kept throughout; the only additions are corner-origin
`pitchX`/`pitchY` coordinates.

Tracking files are around 90 MB a match, so `streamTracking` is an async
generator that aborts the download when the caller stops consuming, and
`fetchTrackingWindow` reads a window with an HTTP `Range` request.
`fetchTracking` reads the whole file for server-side use.

Two things about the dataset that the types and docs make explicit rather than
smoothing over: tracking coordinates are absolute and swap ends at half time
while dynamic-event `x` is normalised to the attacking direction, and pitch
dimensions vary per match (104–106 m), so coordinates are translated using each
match's own declared dimensions.

Adds `csv-parse` as a runtime dependency — two of the three SkillCorner files
are CSV. It has no dependencies of its own.
