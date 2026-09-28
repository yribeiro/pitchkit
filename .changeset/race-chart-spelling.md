---
"@pitchkit/react": minor
---

`<RaceChart>`'s `emphasize` prop is now `emphasise`, matching the project's
British spelling. It has not shipped in a release, so nothing downstream breaks.

Markers and end labels are also now painted above every series line rather than
per-series, so a second team's line can no longer run over the first team's goal
markers. Annotation children stay above both.
