import type { ImpectEvent } from "./types.js";

/**
 * Impect's interpretation layer: composable filters over Impect's own
 * fields, for `.filter()`. Each reads a field rather than adding one, so the
 * data stays as Impect wrote it.
 */

/**
 * Has a start position. Goals, own goals, fouls and offsides lack one, as do
 * markers such as `NO_VIDEO` and `FINAL_WHISTLE`.
 */
export function hasLocation(
  event: ImpectEvent,
): event is ImpectEvent & { readonly x: number; readonly y: number } {
  return event.x !== undefined && event.y !== undefined;
}

/** Has an end position, as passes, carries and shots almost always do. */
export function hasEndLocation(
  event: ImpectEvent,
): event is ImpectEvent & { readonly endX: number; readonly endY: number } {
  return event.endX !== undefined && event.endY !== undefined;
}

/**
 * A ball played on purpose: a `PASS`, or a set piece taken as one (corner,
 * free kick, throw-in, goal kick, kick-off). Each carries a `pass` object.
 */
export function hasPass(event: ImpectEvent): boolean {
  return event.pass !== null && event.pass !== undefined;
}

/** `result: "SUCCESS"`. For a pass, it reached a teammate under pressure below 80. */
export function isSuccessful(event: ImpectEvent): boolean {
  return event.result === "SUCCESS";
}

/** `result: "FAIL"`. For a pass: to an opponent, out of play, or offside. */
export function isFailed(event: ImpectEvent): boolean {
  return event.result === "FAIL";
}

/**
 * A shot that scored. Impect also log each goal as a separate `GOAL` event,
 * which has no position; this is the shot itself, with one.
 */
export function isGoal(event: ImpectEvent): boolean {
  return event.actionType === "SHOT" && event.result === "SUCCESS";
}

/**
 * An own goal. `squadId` is the team that **conceded** it, and it has no
 * position. Shots don't include these, so a goal tally from shots alone
 * misses them; `score` counts both.
 */
export function isOwnGoal(event: ImpectEvent): boolean {
  return event.actionType === "OWN_GOAL";
}

export function isPenalty(event: ImpectEvent): boolean {
  return event.actionType === "SHOT" && event.action === "PENALTY_KICK";
}

export function isDirectFreeKick(event: ImpectEvent): boolean {
  return event.actionType === "SHOT" && event.action === "DIRECT_FREE_KICK";
}

export function isHeader(event: ImpectEvent): boolean {
  return event.bodyPart === "HEAD";
}

/** Has a goal-mouth target point, which about one shot in three does. */
export function hasTargetPoint(event: ImpectEvent): event is ImpectEvent & {
  readonly shot: NonNullable<ImpectEvent["shot"]> & {
    readonly targetPoint: { readonly y: number; readonly z: number };
  };
} {
  return event.shot?.targetPoint !== null && event.shot?.targetPoint !== undefined;
}

const SET_PIECES: ReadonlySet<string> = new Set([
  "CORNER",
  "FREE_KICK",
  "THROW_IN",
  "GOAL_KICK",
  "KICK_OFF",
]);

/** A set piece taken as a pass. Penalties and direct free kicks are shots instead. */
export function isSetPiece(event: ImpectEvent): boolean {
  return SET_PIECES.has(event.actionType);
}

export function isCorner(event: ImpectEvent): boolean {
  return event.actionType === "CORNER";
}

export function isFreeKick(event: ImpectEvent): boolean {
  return event.actionType === "FREE_KICK";
}

export function isThrowIn(event: ImpectEvent): boolean {
  return event.actionType === "THROW_IN";
}
