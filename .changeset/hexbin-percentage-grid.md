---
"@pitchkit/core": patch
"@pitchkit/react": patch
---

Fix `<Hexbin>` drawing squashed hexagons on percentage-grid pitches (`opta`, `wyscout`)
([#99](https://github.com/yribeiro/pitchkit/issues/99)). `computeHexBins` built its lattice in grid
units, where one x unit is 1.05 m and one y unit 0.68 m, so hexagons came out about 1.5 times too wide
for their height and points fell into different bins than on the same pitch in metres. The lattice is
now built in metres on those pitches. `HexBin.radius` is in those display units, and `hexCorners` takes
an optional `dimensions` argument to convert the corners back per axis. Other pitch types are unchanged.
