import { isGoal, isOwnGoal } from "./predicates.js";
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
 * Shots only: events whose `eventName` is `"Shot"`.
 *
 * **Not every goal attempt is here.** Wyscout records a penalty and a direct
 * free kick as `Free Kick` events, so `shots(events).filter(isGoal)` misses
 * any goal scored from either. Use `goalAttempts` for a shot map or a goal
 * count.
 */
export function shots(events: readonly WyscoutEvent[]): WyscoutEvent[] {
  return ofType(events, "Shot");
}

/** The `Free Kick` sub-events that are attempts on goal. */
const FREE_KICK_ATTEMPTS: ReadonlySet<string> = new Set(["Penalty", "Free kick shot"]);

/**
 * Every attempt on goal: each `Shot`, plus each `Free Kick` whose
 * `subEventName` is `"Penalty"` or `"Free kick shot"`.
 *
 * Filter this, not the whole feed, for `isGoal`. Wyscout puts tag 101 on the
 * scoring action *and* on the conceding keeper's `Save attempt`, so
 * `events.filter(isGoal)` counts most goals twice.
 *
 * `goalAttempts(events).filter(isGoal)` is still not the score: shootout
 * kicks are here too, and own goals are not. `goalsFor` counts the score.
 */
export function goalAttempts(events: readonly WyscoutEvent[]): WyscoutEvent[] {
  return events.filter(
    (event) =>
      event.eventName === "Shot" ||
      (event.eventName === "Free Kick" && FREE_KICK_ATTEMPTS.has(event.subEventName)),
  );
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

/**
 * One team's score, as the scoreboard showed it at the end of play.
 *
 * Goal attempts tagged 101 by `teamId`, plus own goals (tag 102) by the
 * other side. An own goal is not an attempt: it carries 102 rather than 101,
 * on the event of the player who put it in, usually `Others on the ball`, and
 * that event's `teamId` is the side that conceded. Shootout kicks, which are
 * penalties in `matchPeriod: "P"`, are left out.
 *
 * Zero for a team with no events in the feed, rather than crediting it with
 * every own goal in the match.
 */
export function goalsFor(events: readonly WyscoutEvent[], teamId: number): number {
  if (!events.some((event) => event.teamId === teamId)) return 0;
  let goals = 0;
  for (const event of goalAttempts(events)) {
    if (event.teamId === teamId && event.matchPeriod !== "P" && isGoal(event)) goals++;
  }
  for (const event of events) {
    if (event.teamId !== teamId && isOwnGoal(event)) goals++;
  }
  return goals;
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
