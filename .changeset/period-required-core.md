---
"@pitchkit/core": minor
---

**Breaking:** race and momentum helpers now take a period, because minutes restart at 45 for the
second half and a minute alone can't place anything in first-half stoppage time.

- `RaceEvent` and `RacePoint` carry a required `period` (1 for the first half).
  `computeCumulativeSeries` sorts by period, then minute, and drops events whose period isn't a
  whole number from 1.
- `valueAtTime(points, time, period)` counts every event in an earlier period.
- `minuteToX(panels, minute, period)` places the minute in `panels[period - 1]`, clamped to it.

New: `xToMinute(panels, x)` reads a pixel back as `{ period, minute }`, and
`racePeriodRanges(events, endTime?)` gives each period its own range for a race chart.
