import type { WyscoutEvent, WyscoutMatch, WyscoutMatchPlayer, WyscoutPlayer } from "./types.js";

/**
 * Narrowing a mixed feed down to the events you want to draw.
 *
 * Wyscout's discriminant is **top-level** — `event.eventName` — so unlike
 * StatsBomb's nested `type.name`, a plain `=== "Shot"` comparison narrows
 * natively and these selectors are convenience rather than necessity.
 */

/** Every event of one type, e.g. `ofType(events, "Duel")`. */
export function ofType(events: readonly WyscoutEvent[], eventName: string): WyscoutEvent[] {
  return events.filter((event) => event.eventName === eventName);
}

/**
 * Shots only.
 *
 * **Not every goal is here.** Wyscout tags a goal on the scoring action *and*
 * on the conceding keeper's `Save attempt`, and a free kick can be scored
 * directly — measured over six matches, tag 101 sat on 15 shots, 19 save
 * attempts and 3 free kicks. `shots(events).filter(isGoal)` counts each goal
 * once; `events.filter(isGoal)` counts most of them twice.
 */
export function shots(events: readonly WyscoutEvent[]): WyscoutEvent[] {
  return ofType(events, "Shot");
}

export function passes(events: readonly WyscoutEvent[]): WyscoutEvent[] {
  return ofType(events, "Pass");
}

export function duels(events: readonly WyscoutEvent[]): WyscoutEvent[] {
  return ofType(events, "Duel");
}

export function freeKicks(events: readonly WyscoutEvent[]): WyscoutEvent[] {
  return ofType(events, "Free Kick");
}

export function fouls(events: readonly WyscoutEvent[]): WyscoutEvent[] {
  return ofType(events, "Foul");
}

/** Every event by one team. */
export function byTeam(events: readonly WyscoutEvent[], teamId: number): WyscoutEvent[] {
  return events.filter((event) => event.teamId === teamId);
}

/** Every event by one player. */
export function byPlayer(events: readonly WyscoutEvent[], playerId: number): WyscoutEvent[] {
  return events.filter((event) => event.playerId === playerId);
}

/** The two team ids in a match file, home first as the file lists them. */
export function teamIds(match: WyscoutMatch): number[] {
  return Object.keys(match.teams).map(Number);
}

/**
 * Every player in the match, keyed by id, so an event's `playerId` can be
 * turned into a name without walking both squads.
 */
export function indexPlayersById(match: WyscoutMatch): Map<number, WyscoutPlayer> {
  const index = new Map<number, WyscoutPlayer>();
  for (const squad of Object.values(match.players)) {
    for (const entry of squad) {
      if (entry.player) index.set(entry.playerId, entry.player);
    }
  }
  return index;
}

/** One team's squad list. */
export function squadOf(match: WyscoutMatch, teamId: number): readonly WyscoutMatchPlayer[] {
  return match.players[String(teamId)] ?? [];
}

/**
 * Seconds since kick-off, across periods.
 *
 * `eventSec` restarts at zero each period, so sorting a whole match by it
 * interleaves the halves. Regulation periods are treated as 45 minutes and
 * extra-time periods as 15, which is what the dataset's own clock assumes.
 */
export function matchSeconds(event: WyscoutEvent): number {
  const offsets: Record<string, number> = { "1H": 0, "2H": 2700, E1: 5400, E2: 6300, P: 7200 };
  return (offsets[event.matchPeriod] ?? 0) + event.eventSec;
}

/** Events in play order, halves included. */
export function inMatchOrder(events: readonly WyscoutEvent[]): WyscoutEvent[] {
  return [...events].sort((a, b) => matchSeconds(a) - matchSeconds(b));
}
