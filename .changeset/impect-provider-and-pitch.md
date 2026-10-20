---
"@pitchkit/data-providers": minor
"@pitchkit/core": minor
"@pitchkit/react": minor
---

Impect open data, and an `impect` pitch type.

`@pitchkit/data-providers/impect` loads Impect's open event data: all 306
Bundesliga 2023/24 matches, with lineups, squads and players. `fetchMatches`,
`fetchMatchEvents` and the other fetchers take Impect's ids; `shots`, `passes`,
`byTeam` and `inPeriod` narrow the feed; `isGoal`, `isOwnGoal`, `hasPass` and
the other predicates read it. `matchSeconds` gives a match clock, since Impect's
second half starts at 10,000 seconds, and `score` counts goals and own goals,
since the match list has none. Field names are Impect's own; the lifted
`x`/`y`/`endX`/`endY` are the adjusted coordinates, where the acting team
attacks towards `+x`.

Impect's data is **not openly licensed**: their terms allow non-commercial
analytical and research use only, and forbid redistributing it. The package
ships none of it and fetches from Impect's own repository.

`core` gains the `"impect"` pitch type: 105x68 metres from the centre spot,
y up (mplsoccer's `impect`). It widens the public `PitchTypeId` union, which is
additive for callers, though an exhaustive `switch` over it gains a case.

The bundled skill documents the pitch type and the loader, and its per-provider
recipes move to a new `references/data-providers.md`, keeping `SKILL.md` under
its length guidance.
