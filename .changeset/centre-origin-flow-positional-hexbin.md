---
"@pitchkit/core": patch
---

Fix three layers on centre-origin pitches (`type="skillcorner"`), which skipped the extent-frame
conversion every other layer goes through ([#90](https://github.com/yribeiro/pitchkit/issues/90)):

- `<Flow>` / `computeFlowBins`: vectors starting at a negative `x` or `y` are no longer dropped,
  and arrows start at their cell's centre instead of half a pitch away.
- `<PositionalHeatmap>` / `computePositionalZones`: zones are returned in provider coordinates,
  as documented, so they are drawn on the pitch where their points are. Counts were already
  right.
- `<Hexbin>`: the layer is clipped to the whole pitch instead of one quarter of it.

Corner-origin pitches (StatsBomb, Opta, UEFA, Wyscout) are unchanged.
