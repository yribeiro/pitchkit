# @pitchkit/data-providers

Convenience loaders for open football data, shaped for [PitchKit](https://pitchkitjs.com).
Raw provider JSON in, typed events out — with the coordinates already where a
`<Scatter>` accessor wants them.

Two provider modules today: **StatsBomb** (events + 360 tracking) and
**SkillCorner** (broadcast tracking, dynamic events, phases of play), each on
its own import subpath so you only pull in what you use.

```bash
npm install @pitchkit/data-providers
```

One runtime dependency (`csv-parse`, for SkillCorner's CSV files), and no
dependency on `@pitchkit/core` or `@pitchkit/react` — it's pure data
transformation, useful on its own.

## A shot map, end to end

```tsx
import { fetchMatchEvents, shots, isGoal } from "@pitchkit/data-providers/statsbomb";
import { Scatter, VerticalPitch } from "@pitchkit/react";

const events = await fetchMatchEvents(15946);
const barcelona = shots(events).filter((shot) => shot.team.name === "Barcelona");

<VerticalPitch type="statsbomb">
  <Scatter
    data={barcelona}
    x={(shot) => shot.x}
    y={(shot) => shot.y}
    r={(shot) => 3 + Math.sqrt(shot.shot.statsbomb_xg) * 11}
    fill={(shot) => (isGoal(shot) ? "orange" : "steelblue")}
  />
</VerticalPitch>;
```

## What this is (and isn't)

A convenience package, for tutorials, prototypes, learning and agent-assisted
builds — getting from "a match id" to "a chart" without a data pipeline in
between.

It is **not** a production data layer. If you already have your own pipeline,
you don't need this: PitchKit's marks take accessor functions, so they read
whatever shape your data is already in. Nothing here is required to use
PitchKit.

## Design

**StatsBomb's data stays StatsBomb's.** Fields keep their names and their
`snake_case` spelling; values keep StatsBomb's own strings. An outcome is
`"Off T"`, not `"off-target"`. You can read StatsBomb's spec and this package's
types side by side with no mapping table in between, and nothing is
paraphrased into a vocabulary you'd then have to learn.

**Coordinates are the one exception.** `location` and `end_location` arrays are
_also_ surfaced as `x`, `y`, `endX`, `endY` (and `endZ` for shots that left the
ground), so they drop straight into an accessor. The original arrays are left
untouched.

**Interpretation lives in functions, not fields.** There's no invented
`complete: boolean` on a pass — there's an `isComplete(pass)` you apply. Same
for `isGoal`, `isCorner`, `isCross`. The data stays a faithful record; the
reading of it is opt-in and inspectable.

**Nothing is dropped.** Only shots, passes and carries are typed explicitly.
Every other event type comes back as a `StatsBombGenericEvent` with its own
sub-object intact — reach it with `ofType(events, "Duel")`. There is no `raw`
field because the parsed event _is_ the original, spread, plus coordinates.

### Narrowing goes through the guards

StatsBomb's discriminant is `type.name` — nested one level down. TypeScript
only narrows unions on _top-level_ literal discriminants, so this compiles
but does **not** narrow:

```ts
if (event.type.name === "Shot") {
  event.shot.statsbomb_xg; // ✗ Property 'shot' does not exist on type 'StatsBombEvent'
}
```

Use the guards instead — they narrow properly, and they check the sub-object
is really present rather than trusting the name:

```ts
if (isShot(event)) {
  event.shot.statsbomb_xg; // ✓
}
```

Hoisting a top-level discriminant would fix this, but only by inventing a
field StatsBomb doesn't have — which is exactly what this package avoids.

## API

Import from `@pitchkit/data-providers/statsbomb`. Everything is tree-shakeable,
and provider modules are separate entry points so you never pull in code for a
provider you don't use.

**Parse** — pure, no network. `parseEvents`, `parseCompetitions`,
`parseMatches`, `parseLineups`.

**Load from a URL** — a mirror, your own host, anything. `loadEvents`,
`loadCompetitions`, `loadMatches`, `loadLineups`, `loadThreeSixty`.

**Fetch from open data** — builds the public URL for you. `fetchMatchEvents(matchId)`,
`fetchCompetitions()`, `fetchMatches(competitionId, seasonId)`,
`fetchLineups(matchId)`, `fetchMatchThreeSixty(matchId)`. Each takes optional
`{ baseUrl, fetch, signal }`, so you can point at a mirror or wrap the request
(Next.js caching, a proxy, a test stub). Built on the global `fetch` — no HTTP
client dependency.

Note that `competitions.json` rows are competition **and season** pairs, which
is why `fetchMatches` needs both ids.

**Select** — `shots`, `passes`, `carries`, `ofType`, and the `isShot` /
`isPass` / `isCarry` guards. For 360 data: `indexThreeSixtyByEvent` (the
join), `teammatesIn`/`opponentsIn`/`actorIn`/`keeperIn` (filtering a frame's
tracked players), and `visibleAreaPolygon` (the camera-coverage polygon as
point pairs for a `Polygon` layer).

**Predicates** — `isComplete`, `isCorner`, `isFreeKick`, `isThrowIn`,
`isCross`, `isThroughBall`, `isSwitch`, `isAssist`, `isKeyPass`, `isSetPiece`,
`isGoal`, `isPenalty`, `isOnTarget`. For 360 tracked players: `isTeammate`,
`isOpponent`, `isActor`, `isKeeper`.

### 360 tracking data

```ts
import {
  fetchMatchEvents,
  fetchMatchThreeSixty,
  indexThreeSixtyByEvent,
  isShot,
} from "@pitchkit/data-providers/statsbomb";

const [events, frames] = await Promise.all([
  fetchMatchEvents(3857276),
  fetchMatchThreeSixty(3857276),
]);
const frameByEvent = indexThreeSixtyByEvent(frames);

const shot = events.find(isShot);
const frame = shot && frameByEvent.get(shot.id); // undefined if this event wasn't tracked
```

Not every match has 360 coverage, and not every event within a covered match
has a frame — coverage varies by match (85% in one sampled World Cup match)
since 360 only runs on events the camera could see. Check
`match.match_status_360 === "available"` before fetching, and don't assume
`frameByEvent.get(event.id)` will hit even within a covered match.

A tracked player carries no identity — `{ teammate, actor, keeper, location }`
only, relative to the event's own team — which is why the selectors above
read like predicates rather than lookups.

### Gotchas worth knowing

- **A completed pass has no `outcome` at all.** StatsBomb encodes success as
  the _absence_ of `pass.outcome`, not as a value — testing for
  `outcome.name === "Complete"` finds nothing. That's what `isComplete` is for.
- **Events files are large; 360 files are larger.** A match's events are
  roughly 3 MB, its 360 tracking 5-7 MB — fetch once and cache either.
- **`endZ` is optional**, even on shots: StatsBomb writes a two-element
  `end_location` for a shot that never left the ground.
- **Some events have no location** — Starting XI, Half Start, Substitution and
  friends — so `x`/`y` are optional on the base event. They're required on
  shots, passes and carries, which always have one.

## SkillCorner

```ts
import {
  fetchMatch,
  fetchDynamicEvents,
  streamTracking,
  offBallRuns,
} from "@pitchkit/data-providers/skillcorner";

const match = await fetchMatch(1874553);
const runs = offBallRuns(await fetchDynamicEvents(match));
```

20 A-League 2024/25 matches of broadcast tracking, plus SkillCorner's derived
dynamic events and phases of play. Same four layers as above, with four
differences that matter before you plot anything:

- **Coordinates are metres from the centre spot**, on a pitch whose real
  dimensions vary by match (104, 105 and 106 m all appear in the dataset). The
  parsers add corner-origin `pitchX`/`pitchY` using that match's own
  dimensions, leaving `x`/`y` exactly as SkillCorner wrote them — which is why
  the loaders take the match object, not just its id. They stay in that
  match's real metres; mapping onto a fixed pitch type is your call.
- **The two files disagree about direction.** Tracking positions are absolute
  and swap ends at half time; dynamic-event `x` is normalised so positive
  always points at the goal being attacked. Mixing them up mirrors half a
  match silently. `attackingSideOf(match, teamId, period)` resolves the former.
- **Tracking files are ~90 MB** and stored in **Git LFS**, so they come from
  `media.githubusercontent.com`, not the raw host — fetching the raw URL
  returns a 130-byte pointer stub that fails as "not valid JSON". Prefer
  `streamTracking` (an async generator; `break` aborts the download) or
  `fetchTrackingWindow` (an HTTP `Range` read) over `fetchTracking`.
- **Roughly a third of positions are extrapolated, not seen.** Broadcast
  tracking only covers what the camera framed; `is_detected` says which is
  which, and it's worth surfacing rather than hiding.

The dynamic-events CSV has **322 columns**. The ~40 you plot or filter on are
typed; the rest stay reachable under their original names through an index
signature.

Selectors: `playerPossessions`, `passingOptions`, `offBallRuns`,
`onBallEngagements`, `ofEventType`. Tracking joins onto the match through
`indexPlayersById` — on `players[].id`, **not** `trackable_object`.

### Files you already have

Both provider modules split the network layer in two: `loadX(url)` takes any
URL — a mirror, your own bucket, a static server — and `fetchX(id)` is sugar
that builds the open-data URL for you.

If the files are on disk, skip both and use the `parse*` layer, which is pure:

```ts
import { readFileSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import {
  parseMatch,
  parseDynamicEvents,
  parseTrackingFrame,
  pitchProjection,
} from "@pitchkit/data-providers/skillcorner";

// The match file first — everything else needs its pitch dimensions.
const match = parseMatch(JSON.parse(readFileSync("1874553_match.json", "utf8")));
const events = parseDynamicEvents(readFileSync("1874553_dynamic_events.csv", "utf8"), match);
```

Tracking files are far too big to read into a string, so parse them a line at
a time — which is exactly what `parseTrackingFrame` and `pitchProjection` are
exported for:

```ts
const project = pitchProjection(match);
const lines = createInterface({
  input: createReadStream("1874553_tracking_extrapolated.jsonl"),
  crlfDelay: Infinity,
});

for await (const line of lines) {
  if (!line.trim()) continue;
  const frame = parseTrackingFrame(JSON.parse(line), project);
  // …one frame at a time, constant memory
}
```

## Data licence and attribution

This package ships **no data**. It fetches from whatever URL you give it.

The default URLs point at each provider's own open-data repository. **Both ask
to be credited** in anything you publish from their data.

**StatsBomb** — [open-data](https://github.com/statsbomb/open-data) ·
[specifications](https://github.com/statsbomb/open-data/tree/master/doc) ·
[free data hub](https://statsbomb.com/what-we-do/hub/free-data/) ·
[usage terms](https://statsbomb.com/what-we-do/hub/free-data/free-data-usage-terms/).
Released under StatsBomb's own user agreement rather than an OSI licence, so
read the terms before you rely on it.

**SkillCorner** — [opendata](https://github.com/SkillCorner/opendata) ·
[documentation](https://skillcorner.github.io/opendata/) ·
[tutorials](https://github.com/SkillCorner/opendata/tree/master/notebooks/tutorials) ·
[skillcorner.com](https://skillcorner.com/). MIT-licensed, with a request for
credit.

Both providers' documentation is the authority on what the fields mean; this
package only covers loading them.

## Adding a provider

Providers live one per directory under `src/`, each with its own entry in
`package.json`'s `exports` and `tsup.config.ts`'s `entry`. Follow
`src/statsbomb/` — types, parse, load, select, predicates — and keep the same
principle: the provider's own vocabulary in the data, interpretation in the
functions.

## Licence

MIT
