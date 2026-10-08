import type { MetricaEvent } from "./types.js";

/**
 * Metrica's interpretation layer.
 *
 * Everything beyond the event type lives in `Subtype`, as hyphen-joined
 * qualifiers drawn from the groups in Metrica's event definitions: a scored
 * header is `"HEAD-ON TARGET-GOAL"`, a foul in a lost tackle
 * `"TACKLE-FAULT-LOST"`. `hasSubtype` is the primitive, and the named
 * predicates below compose with `.filter()`.
 *
 * Some qualifiers mean different things on different types (`SAVED` on a
 * `SHOT` is its result; on a `RECOVERY` it is the keeper's save), so the
 * named predicates check the type as well wherever that matters.
 *
 * @see https://github.com/metrica-sports/sample-data/blob/master/documentation/events-definitions.pdf
 */

/**
 * The individual qualifiers in an event's `Subtype`. Split on the hyphen
 * only: `"OFF TARGET"` and `"GOAL KICK"` are single qualifiers with a space.
 */
export function subtypesOf(event: MetricaEvent): string[] {
  return event.Subtype === null ? [] : event.Subtype.split("-");
}

/**
 * Whether `Subtype` carries one qualifier, matched whole. `"GOAL"` does not
 * match `"GOAL KICK"`.
 */
export function hasSubtype(event: MetricaEvent, subtype: string): boolean {
  return subtypesOf(event).includes(subtype);
}

/** Has a start position. Every `SET PIECE` and `CARD` lacks one. */
export function hasLocation(
  event: MetricaEvent,
): event is MetricaEvent & { readonly x: number; readonly y: number } {
  return event.x !== undefined && event.y !== undefined;
}

/** Has an end position, as every `PASS` and `SHOT` does. */
export function hasEndLocation(
  event: MetricaEvent,
): event is MetricaEvent & { readonly endX: number; readonly endY: number } {
  return event.endX !== undefined && event.endY !== undefined;
}

// ---------------------------------------------------------------------------
// Shots and goals
// ---------------------------------------------------------------------------

/**
 * A shot that scored, credited to `Team`. Own goals are a separate type;
 * see `isOwnGoal`.
 */
export function isGoal(event: MetricaEvent): boolean {
  return event.Type === "SHOT" && hasSubtype(event, "GOAL");
}

/**
 * An own goal: a `BALL OUT` qualified `GOAL`, which Metrica define as "the
 * player strikes or deflects the ball into their own team's goal". `Team` is
 * the side that **conceded**.
 *
 * Sample Game 1 has one, by Home, and the next kick-off is Home's: that is
 * the away side's only goal, in a 3-1 game.
 */
export function isOwnGoal(event: MetricaEvent): boolean {
  return event.Type === "BALL OUT" && hasSubtype(event, "GOAL");
}

/** A shot on target, scored or saved. */
export function isOnTarget(event: MetricaEvent): boolean {
  return event.Type === "SHOT" && hasSubtype(event, "ON TARGET");
}

/** A shot the keeper, or the last defender, kept out. */
export function isSaved(event: MetricaEvent): boolean {
  return event.Type === "SHOT" && hasSubtype(event, "SAVED");
}

/** A shot deflected by a defender who wasn't the last in line. */
export function isBlocked(event: MetricaEvent): boolean {
  return event.Type === "SHOT" && hasSubtype(event, "BLOCKED");
}

/** Hit the post or crossbar: a `SHOT`, a `BALL LOST` or a `BALL OUT` alike. */
export function isWoodwork(event: MetricaEvent): boolean {
  return hasSubtype(event, "WOODWORK");
}

/** Played with the head: a shot, pass, clearance or lost ball. */
export function isHeader(event: MetricaEvent): boolean {
  return hasSubtype(event, "HEAD");
}

// ---------------------------------------------------------------------------
// Passing
// ---------------------------------------------------------------------------

/** A cross, whether it found a teammate (`PASS`) or not (`BALL LOST`, `BALL OUT`). */
export function isCross(event: MetricaEvent): boolean {
  return hasSubtype(event, "CROSS");
}

export function isThroughBall(event: MetricaEvent): boolean {
  return hasSubtype(event, "THROUGH BALL");
}

export function isClearance(event: MetricaEvent): boolean {
  return hasSubtype(event, "CLEARANCE");
}

// ---------------------------------------------------------------------------
// Challenges and cards
// ---------------------------------------------------------------------------

/** A challenge this player won. */
export function wonChallenge(event: MetricaEvent): boolean {
  return event.Type === "CHALLENGE" && hasSubtype(event, "WON");
}

/** A challenge this player lost. */
export function lostChallenge(event: MetricaEvent): boolean {
  return event.Type === "CHALLENGE" && hasSubtype(event, "LOST");
}

/**
 * A challenge the referee gave a free kick for. Read it with the result: a
 * `"TACKLE-FAULT-WON"` is the fouled player's side of the challenge, and
 * `"TACKLE-FAULT-LOST"` the side of the player who committed the foul.
 */
export function isFault(event: MetricaEvent): boolean {
  return event.Type === "CHALLENGE" && hasSubtype(event, "FAULT");
}

export function isYellowCard(event: MetricaEvent): boolean {
  return event.Type === "CARD" && hasSubtype(event, "YELLOW");
}

export function isRedCard(event: MetricaEvent): boolean {
  return event.Type === "CARD" && hasSubtype(event, "RED");
}

// ---------------------------------------------------------------------------
// Set pieces
// ---------------------------------------------------------------------------

export function isKickOff(event: MetricaEvent): boolean {
  return event.Type === "SET PIECE" && hasSubtype(event, "KICK OFF");
}

export function isCornerKick(event: MetricaEvent): boolean {
  return event.Type === "SET PIECE" && hasSubtype(event, "CORNER KICK");
}

export function isFreeKick(event: MetricaEvent): boolean {
  return event.Type === "SET PIECE" && hasSubtype(event, "FREE KICK");
}

/** A penalty kick. Sample Game 2 has one. */
export function isPenalty(event: MetricaEvent): boolean {
  return event.Type === "SET PIECE" && hasSubtype(event, "PENALTY");
}

export function isThrowIn(event: MetricaEvent): boolean {
  return event.Type === "SET PIECE" && hasSubtype(event, "THROW IN");
}

/**
 * A goal kick. **Not a `SET PIECE`** in this data: Metrica put the qualifier
 * on the kick itself, so it is a `PASS`, `BALL LOST` or `BALL OUT`.
 */
export function isGoalKick(event: MetricaEvent): boolean {
  return hasSubtype(event, "GOAL KICK");
}
