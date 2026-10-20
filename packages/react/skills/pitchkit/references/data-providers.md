# `@pitchkit/data-providers`, per provider

Read the section for the provider in hand before writing code against it. Each keeps that
provider's own field names and values, lifts coordinates to `x`/`y`/`endX`/`endY` (except
SkillCorner, whose are already metres from the centre spot), and plots raw on its own
`<Pitch type>`. No provider's data ships with the package: it is fetched from the provider's
own repository (Wyscout's from a mirror), and every provider asks to be credited.

## StatsBomb — `/statsbomb`, `type="statsbomb"`

```ts
import { fetchMatchEvents, isGoal, shots } from "@pitchkit/data-providers/statsbomb";

const goals = shots(await fetchMatchEvents(3943043)).filter(isGoal); // Euro 2024 final
```

**Narrowing goes through the selectors and guards, never through `event.type.name`.**
StatsBomb's discriminant is nested inside `type`, and TypeScript only narrows on
_top-level_ literal discriminants — so `if (event.type.name === "Shot") event.shot` runs
correctly but fails to typecheck. Use `shots(events)` or `isShot(event)`. A completed pass has
no `outcome` at all; use `isComplete`.

## SkillCorner — `/skillcorner`, `type="skillcorner"`

```ts
import { fetchMatch, offBallRuns, streamTracking } from "@pitchkit/data-providers/skillcorner";

const match = await fetchMatch(1874553);

// Tracking is ~90 MB a match. streamTracking is an async generator, so leaving
// the loop aborts the download — take a clip rather than the file.
const frames = [];
for await (const frame of streamTracking(match)) {
  if (frame.period === null || frame.player_data.length === 0) continue;
  frames.push(frame);
  if (frames.length >= 300) break;
}
```

Tracking coordinates are **absolute** and swap ends at half time, while dynamic-event
coordinates are **normalised to the attacking direction** — mixing them mirrors half a match
silently. `is_detected: false` means extrapolated, not seen. Pass the match's own
`pitch_length`/`pitch_width` as `<Pitch dimensions>`.

## Wyscout — `/wyscout`, `type="wyscout"`

```ts
import { fetchMatch, isGoal, shotGoalZone, shots } from "@pitchkit/data-providers/wyscout";

const match = await fetchMatch(2499943); // Liverpool 4–3 Manchester City, 2018
const goals = shots(match.events).filter(isGoal);
```

`fetchMatch` returns events and both squads; there is no `fetchMatches`. `x` is normalised to
the attacking direction. **A goal is also tagged on the conceding keeper's save**, so filter
`shots(events)` before `isGoal`. **A shot has no end coordinate** (`positions[1]` is a
placeholder); `shotGoalZone(shot)` reads where it went. Nearly everything else is a tag:
`hasTag`, `WYSCOUT_TAGS`, `isAccurate`, `wonDuel`.

## Metrica — `/metrica`, `type="metrica"`

```ts
import { fetchEvents, fetchTrackingWindow, isGoal, shots } from "@pitchkit/data-providers/metrica";

const goal = shots(await fetchEvents(1)).find(isGoal)!; // sample games 1 and 2
const frames = await fetchTrackingWindow(1, {
  fromFrame: goal["Start Frame"],
  toFrame: goal["End Frame"],
});
```

Fields are the CSV headers verbatim (`goal["Start Frame"]` is a tracking `Frame`); the
package's additions (`x`, `ball`, `players`) are lowercase. Coordinates are **absolute** and
swap at half time: `attackingDirection(kickOffFrame, team)`. An own goal is a `BALL OUT`
(`isOwnGoal`). Tracking is two 32 MB files, so window or stream it; `ball` is often `null`.

## Impect — `/impect`, `type="impect"`

```ts
import {
  fetchMatchEvents,
  fetchMatches,
  IMPECT_BUNDESLIGA_2023_24,
  isGoal,
  matchSeconds,
  score,
  shots,
} from "@pitchkit/data-providers/impect";

const matches = await fetchMatches(IMPECT_BUNDESLIGA_2023_24); // all 306
const match = matches.find((m) => m.id === 122838)!; // Werder Bremen v Bayern
const events = await fetchMatchEvents(match.id); // ~5 MB: fetch once
const goals = shots(events).filter(isGoal);
const minutes = goals.map((goal) => matchSeconds(goal) / 60);
const { home, away } = score(events, match); // the match list carries no score
```

**Not openly licensed:** Impect allow non-commercial analytical and research use only, forbid
redistributing or altering the data, and require Impect to be credited, with their logo. Say
so when building anything public with it.

`x`/`y` are the **adjusted** coordinates: the acting team attacks towards `+x` in both halves
(a defender's clearance is seen from the defender's side). The absolute ones are at
`start.coordinates`, and swap ends at half time. **`gameTimeInSec` restarts at 10,000 for the
second half**: use `matchSeconds` for minutes and `inMatchOrder` to sort. **Set pieces aren't
`PASS` events** (a corner is `CORNER`, with a `pass` object), so use `hasPass` for every ball
played. A goal is a `SHOT` with `result: "SUCCESS"` plus a separate `GOAL` marker with no
position; an own goal is `OWN_GOAL`, credited to the team that conceded.
