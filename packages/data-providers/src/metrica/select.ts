import type {
  MetricaEvent,
  MetricaEventType,
  MetricaFrame,
  MetricaTeam,
  MetricaTrackedPlayer,
} from "./types.js";

/**
 * Narrowing an events feed, and reading a tracking frame.
 *
 * Metrica's discriminant is the top-level `Type`, so `event.Type === "SHOT"`
 * works as well as `shots(events)`; these are convenience.
 */

/** Every event of one type, e.g. `ofType(events, "CHALLENGE")`. */
export function ofType(events: readonly MetricaEvent[], type: MetricaEventType): MetricaEvent[] {
  return events.filter((event) => event.Type === type);
}

/**
 * Shots only. **An own goal isn't one**: Metrica record it as a `BALL OUT`
 * by the player who put it in, so `shots(events).filter(isGoal)` misses
 * Sample Game 1's only away goal. See `isOwnGoal`.
 */
export function shots(events: readonly MetricaEvent[]): MetricaEvent[] {
  return ofType(events, "SHOT");
}

/**
 * Passes only. Every one reached a teammate: Metrica record a pass that
 * didn't as `BALL LOST` (or `BALL OUT`), so there is no "incomplete pass" to
 * filter out here.
 */
export function passes(events: readonly MetricaEvent[]): MetricaEvent[] {
  return ofType(events, "PASS");
}

export function challenges(events: readonly MetricaEvent[]): MetricaEvent[] {
  return ofType(events, "CHALLENGE");
}

export function setPieces(events: readonly MetricaEvent[]): MetricaEvent[] {
  return ofType(events, "SET PIECE");
}

/** Every event by one side, `"Home"` or `"Away"`. */
export function byTeam(events: readonly MetricaEvent[], team: MetricaTeam): MetricaEvent[] {
  return events.filter((event) => event.Team === team);
}

/** Every event belonging to one player, matched on `From`. */
export function byPlayer(events: readonly MetricaEvent[], player: string): MetricaEvent[] {
  return events.filter((event) => event.From === player);
}

/** Every event or frame in one half. */
export function inPeriod<T extends { readonly Period: number }>(
  rows: readonly T[],
  period: number,
): T[] {
  return rows.filter((row) => row.Period === period);
}

/** One side's players in a frame. */
export function playersOfTeam(frame: MetricaFrame, team: MetricaTeam): MetricaTrackedPlayer[] {
  return frame.players.filter((player) => player.team === team);
}

/**
 * One player's position in a frame, or `undefined` if they aren't on the
 * pitch in it. Takes the same spelling as an event's `From` and `To`, so
 * `findPlayer(frame, pass.To)` places the receiver.
 */
export function findPlayer(
  frame: MetricaFrame,
  player: string | null,
): MetricaTrackedPlayer | undefined {
  return player === null ? undefined : frame.players.find((p) => p.player === player);
}

/**
 * Which way a side is attacking, read off a frame.
 *
 * Neither file states it, and it differs between the sample games: Home
 * attack towards `x = 1` in Sample Game 1's first half and towards `x = 0`
 * in Sample Game 2's. Teams swap at half time.
 *
 * This compares the side's mean x with the halfway line, so **pass a kick-off
 * frame**, where the laws put every player in their own half and the answer
 * is unambiguous; the first frame of each period is one. Mid-play, a side
 * pressing high can stand mostly in the opponent's half. Returns `null` if
 * the side has no one on the pitch in the frame.
 */
export function attackingDirection(
  frame: MetricaFrame,
  team: MetricaTeam,
): "left_to_right" | "right_to_left" | null {
  const players = playersOfTeam(frame, team);
  if (players.length === 0) return null;
  const meanX = players.reduce((sum, player) => sum + player.x, 0) / players.length;
  return meanX < 0.5 ? "left_to_right" : "right_to_left";
}
