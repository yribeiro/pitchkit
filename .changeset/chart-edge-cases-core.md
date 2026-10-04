---
"@pitchkit/core": minor
---

Fix two chart edge cases from [#83](https://github.com/yribeiro/pitchkit/issues/83):

- `stackOffsets` no longer re-centres a stack of markers back onto the marker before it. A run is
  shifted towards its true positions only as far as it stays `size` clear of its left neighbour.
- `computeCumulativeSeries(events, until?)` takes an optional end point, `{ period, time }`.
  Events after it are dropped while each point keeps its index into the caller's array.
