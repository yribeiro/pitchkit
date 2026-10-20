import type {
  ImpectActionType,
  ImpectEvent,
  ImpectMatchSummary,
  ImpectPlayer,
  ImpectSquad,
} from "./types.js";

/**
 * Narrowing a match's events down to the ones you want to draw.
 *
 * Impect's discriminant is top-level, `event.actionType`, so a plain
 * `=== "SHOT"` comparison works as well as `shots(events)`; these are
 * convenience.
 */

/** Every event of one action type, e.g. `ofType(events, "INTERCEPTION")`. */
export function ofType(
  events: readonly ImpectEvent[],
  actionType: ImpectActionType,
): ImpectEvent[] {
  return events.filter((event) => event.actionType === actionType);
}

/**
 * Shots, penalties and direct free kicks included (`action` tells them apart).
 * A scored one has `result: "SUCCESS"`; see `isGoal`. Own goals aren't shots.
 */
export function shots(events: readonly ImpectEvent[]): ImpectEvent[] {
  return ofType(events, "SHOT");
}

/**
 * `PASS` events only. **Set-piece deliveries are not among them**: a corner,
 * free kick, throw-in, goal kick or kick-off is its own action type, though
 * it carries a `pass` object too. For every ball played on purpose, filter
 * on `hasPass` instead.
 */
export function passes(events: readonly ImpectEvent[]): ImpectEvent[] {
  return ofType(events, "PASS");
}

/** Every event by one team, by `squadId`. */
export function byTeam(events: readonly ImpectEvent[], squadId: number): ImpectEvent[] {
  return events.filter((event) => event.squadId === squadId);
}

/** Every event by one player. */
export function byPlayer(events: readonly ImpectEvent[], playerId: number): ImpectEvent[] {
  return events.filter((event) => event.player?.id === playerId);
}

/** Every event in one period: `1` and `2` for the halves, `3` and `4` for extra time. */
export function inPeriod(events: readonly ImpectEvent[], periodId: number): ImpectEvent[] {
  return events.filter((event) => event.periodId === periodId);
}

/** Where each period's `gameTimeInSec` starts, and where its match clock does. */
const PERIOD_OFFSETS: Readonly<Record<number, readonly [number, number]>> = {
  1: [0, 0],
  2: [10_000, 2_700],
  3: [20_000, 5_400],
  4: [30_000, 6_300],
};

/**
 * Seconds on the match clock: the second half starts at 45:00, as a
 * broadcast shows it.
 *
 * Impect's `gameTimeInSec` restarts each period at 10,000-second steps, so
 * `gameTimeInSec / 60` gives a minute of 166 early in the second half. As on
 * any match clock, first-half stoppage time overlaps the start of the second
 * half; sort with `inMatchOrder`, not on this.
 *
 * Impect define four periods (two halves, two of extra time). An event in any
 * other period, which the open data doesn't have, gets its `gameTimeInSec`
 * back unchanged, as Wyscout's `matchSeconds` does for an unknown period.
 */
export function matchSeconds(event: ImpectEvent): number {
  const [from, to] = PERIOD_OFFSETS[event.periodId] ?? [0, 0];
  return to + (event.gameTime.gameTimeInSec - from);
}

/** Events in play order. `gameTimeInSec`'s period offsets make it sort correctly as is. */
export function inMatchOrder(events: readonly ImpectEvent[]): ImpectEvent[] {
  return [...events].sort((a, b) => a.gameTime.gameTimeInSec - b.gameTime.gameTimeInSec);
}

/**
 * A match's score, from its events: each side's `GOAL`s plus the other side's
 * `OWN_GOAL`s, which Impect credit to the team that conceded. The match list
 * carries no score of its own.
 */
export function score(
  events: readonly ImpectEvent[],
  match: Pick<ImpectMatchSummary, "homeSquadId" | "awaySquadId">,
): { readonly home: number; readonly away: number } {
  let home = 0;
  let away = 0;
  for (const event of events) {
    if (event.actionType === "GOAL") {
      if (event.squadId === match.homeSquadId) home++;
      else if (event.squadId === match.awaySquadId) away++;
    } else if (event.actionType === "OWN_GOAL") {
      if (event.squadId === match.homeSquadId) away++;
      else if (event.squadId === match.awaySquadId) home++;
    }
  }
  return { home, away };
}

/** Players keyed by id, so an event's `player.id` can be turned into a name. */
export function indexPlayersById(players: readonly ImpectPlayer[]): Map<number, ImpectPlayer> {
  return new Map(players.map((player) => [player.id, player]));
}

/** Squads keyed by id, so an event's `squadId` can be turned into a club name. */
export function indexSquadsById(squads: readonly ImpectSquad[]): Map<number, ImpectSquad> {
  return new Map(squads.map((squad) => [squad.id, squad]));
}
