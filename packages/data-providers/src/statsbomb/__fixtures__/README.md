# StatsBomb test fixtures

Real StatsBomb open-data JSON, trimmed. Test-only — `package.json`'s
`files: ["dist"]` keeps all of it out of the published tarball.

Data © [StatsBomb](https://github.com/statsbomb/open-data), used under their open-data
user agreement.

## Provenance

All files were cut from the open-data repo at
`https://raw.githubusercontent.com/statsbomb/open-data/master/data`:

| File                              | Source                     | Trimming                                            |
| ---------------------------------- | -------------------------- | --------------------------------------------------- |
| `events-15946-sample.json`         | `events/15946.json`        | 29 of 3762 events, selected by the criteria below    |
| `competitions-sample.json`         | `competitions.json`        | first 3 of 80 rows                                   |
| `matches-43-106-sample.json`       | `matches/43/106.json`      | first 3 matches                                      |
| `lineups-15946-sample.json`        | `lineups/15946.json`       | both teams, first 3 players each                     |
| `events-3857276-sample.json`       | `events/3857276.json`      | 12 of 3388 events, the ones matching the frames below |
| `three-sixty-3857276-sample.json`  | `three-sixty/3857276.json` | 12 of 2873 frames, selected by the criteria below     |

Events and frames are unmodified and kept in their original chronological
(`index`) order. Nothing was synthesised — if a case isn't in this file, it
wasn't in the match.

Match 15946 predates StatsBomb's 360 rollout and has no tracking data, so the
360 fixtures use a different match (3857276) — its events sample is a
**separate, smaller cut of the same match**, kept in step with the 360
sample so `event_uuid`/`id` actually join (see `indexThreeSixtyByEvent`'s
tests), rather than reusing the 15946 events fixture.

## Why these 29 events

One event per case the parsers and predicates need to handle, so a
regression in any of them fails a test rather than going unnoticed:

- **Shots** — a goal, an off-target, a saved, a free kick, one carrying a
  `freeze_frame`, and crucially one with a **2-element** `end_location`
  alongside one with a 3-element one (the reason `endZ` is optional).
- **Passes** — two complete (no `outcome` key at all — the trap `isComplete`
  exists for), an incomplete, an out, a corner, a free kick, a throw-in, a
  cross, a through ball, a switch, a goal assist and a shot assist.
- **Carries** — three.
- **Untyped events** — Duel, Dribble, Pressure, Goal Keeper, Ball Receipt\*,
  Miscontrol and Interception exercise the `StatsBombGenericEvent`
  passthrough, while Starting XI, Half Start and Substitution are the event
  types that carry **no `location`** at all (and Starting XI additionally
  carries a `tactics` object this package doesn't model, which must survive
  parsing intact).

## Why these 12 events/frames (match 3857276)

- A shot with a frame (freeze-frame players include a tracked shooter and
  keeper) and a second shot for variety.
- Passes and a carry, so `indexThreeSixtyByEvent` has more than one event
  type to join against.
- A frame with the **minimum** player count (3) and one with a **large**
  count (20+) — density at both ends of what a `<Voronoi>`/`<Scatter>` layer
  needs to handle.
- At least one frame flagged with a tracked **keeper**.
- One frame per `visible_area` length StatsBomb writes (10, 12 and 14
  numbers — a hexagon, pentagon or heptagon of camera coverage,
  respectively), so `visibleAreaPolygon` is exercised against all three.
