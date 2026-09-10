---
"@pitchkit/data-providers": minor
---

Add `@pitchkit/data-providers`, a convenience loader for open football data,
starting with StatsBomb.

`@pitchkit/data-providers/statsbomb` takes you from a match id (or any URL) to
chart-ready data in one call: `fetchMatchEvents(15946)` fetches and parses,
`shots()` / `passes()` / `carries()` narrow the result, and predicates like
`isGoal`, `isCorner` and `isComplete` compose on top with `.filter()`.

Events keep StatsBomb's own field names and values — an outcome is `"Off T"`,
not a re-spelled equivalent — so they read against StatsBomb's spec directly.
The only additions are lifted coordinates (`x`, `y`, `endX`, `endY`, `endZ`)
so events drop straight into a PitchKit accessor. Event types beyond shots,
passes and carries come back intact as generic events rather than being
dropped.

Zero runtime dependencies, and no dependency on `@pitchkit/core` or
`@pitchkit/react`.
