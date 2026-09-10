import type { StatsBombPass, StatsBombShot } from "./types.js";

/**
 * Composable filters over StatsBomb's own fields.
 *
 * This is where every piece of interpretation in the package lives. The
 * parsed events stay exactly as StatsBomb wrote them — no derived
 * `complete: boolean`, no re-spelled outcomes — and anything that needs
 * reading between the lines is a function you apply, so it's opt-in and
 * inspectable:
 *
 * ```ts
 * const corners = passes(events).filter(isCorner);
 * const goals = shots(events).filter(isGoal);
 * ```
 *
 * They also cover what a per-event-type accessor structurally cannot: a
 * corner is not a StatsBomb event type, it's a *kind of pass*, so it can only
 * be a predicate.
 */

const SET_PIECE_PASS_TYPES = new Set(["Corner", "Free Kick", "Throw-in", "Goal Kick", "Kick Off"]);
const SET_PIECE_SHOT_TYPES = new Set(["Corner", "Free Kick", "Penalty", "Kick Off"]);

/**
 * Whether a pass found its target.
 *
 * StatsBomb encodes a completed pass as the **absence** of `pass.outcome`
 * rather than as an outcome value, which is the single most common way to
 * get pass numbers wrong. (In match 15946, 984 of 1163 passes have no
 * `outcome` key at all.)
 */
export function isComplete(pass: StatsBombPass): boolean {
  return pass.pass.outcome === undefined;
}

export function isCorner(pass: StatsBombPass): boolean {
  return pass.pass.type?.name === "Corner";
}

export function isFreeKick(pass: StatsBombPass): boolean {
  return pass.pass.type?.name === "Free Kick";
}

export function isThrowIn(pass: StatsBombPass): boolean {
  return pass.pass.type?.name === "Throw-in";
}

export function isCross(pass: StatsBombPass): boolean {
  return pass.pass.cross === true;
}

export function isThroughBall(pass: StatsBombPass): boolean {
  return pass.pass.through_ball === true;
}

/** A pass that switched play from one flank to the other. */
export function isSwitch(pass: StatsBombPass): boolean {
  return pass.pass.switch === true;
}

/** A pass that directly assisted a goal. */
export function isAssist(pass: StatsBombPass): boolean {
  return pass.pass.goal_assist === true;
}

/** A pass that led to a shot, scored or not. */
export function isKeyPass(pass: StatsBombPass): boolean {
  return pass.pass.shot_assist === true || pass.pass.goal_assist === true;
}

/** Whether a pass or shot restarted play rather than coming from open play. */
export function isSetPiece(event: StatsBombPass | StatsBombShot): boolean {
  if ("pass" in event) {
    const typeName = event.pass.type?.name;
    return typeName !== undefined && SET_PIECE_PASS_TYPES.has(typeName);
  }
  return SET_PIECE_SHOT_TYPES.has(event.shot.type.name);
}

export function isGoal(shot: StatsBombShot): boolean {
  return shot.shot.outcome.name === "Goal";
}

export function isPenalty(shot: StatsBombShot): boolean {
  return shot.shot.type.name === "Penalty";
}

/**
 * Whether a shot was heading in.
 *
 * `"Saved Off T"` is deliberately excluded: it records a save on a shot that
 * was going wide, which is a save but not a shot on target.
 */
export function isOnTarget(shot: StatsBombShot): boolean {
  const outcome = shot.shot.outcome.name;
  return outcome === "Goal" || outcome === "Saved" || outcome === "Saved To Post";
}
