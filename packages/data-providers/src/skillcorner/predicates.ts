import type {
  SkillCornerEvent,
  SkillCornerOffBallRun,
  SkillCornerPassingOption,
  SkillCornerPhase,
  SkillCornerPlayerPossession,
  SkillCornerTrackedPlayer,
} from "./types.js";

/**
 * Composable filters over SkillCorner's own fields, meant for `.filter()`.
 *
 * Same principle as the StatsBomb module: interpretation lives in functions,
 * not in invented fields. Nothing here adds a column to the data — each one
 * just reads what SkillCorner already wrote.
 */

// --- Any event -------------------------------------------------------------

export function leadToShot(event: SkillCornerEvent): boolean {
  return event.lead_to_shot === true;
}

export function leadToGoal(event: SkillCornerEvent): boolean {
  return event.lead_to_goal === true;
}

/** Started inside the penalty area the team is attacking. */
export function inPenaltyArea(event: SkillCornerEvent): boolean {
  return event.penalty_area_start === true;
}

export function inAttackingThird(event: SkillCornerEvent): boolean {
  return event.third_start === "attacking_third";
}

/** Has a start position that can actually be plotted. */
export function hasLocation(event: SkillCornerEvent): boolean {
  return typeof event.pitchX === "number" && typeof event.pitchY === "number";
}

/** Has both a start and an end position — needed for arrows and comets. */
export function hasPath(event: SkillCornerEvent): boolean {
  return (
    hasLocation(event) && typeof event.pitchEndX === "number" && typeof event.pitchEndY === "number"
  );
}

// --- Off-ball runs ---------------------------------------------------------

export function breaksDefensiveLine(run: SkillCornerOffBallRun): boolean {
  return run.break_defensive_line === true;
}

export function isRunBehind(run: SkillCornerOffBallRun): boolean {
  return run.intended_run_behind === true;
}

/** SkillCorner's own speed banding, rather than a threshold invented here. */
export function isSprint(run: SkillCornerOffBallRun): boolean {
  return run.speed_avg_band === "sprinting";
}

export function isRunSubtype(subtype: string) {
  return (run: SkillCornerOffBallRun): boolean => run.event_subtype === subtype;
}

// --- Passing options -------------------------------------------------------

export function wasTargeted(option: SkillCornerPassingOption): boolean {
  return option.targeted === true;
}

export function wasReceived(option: SkillCornerPassingOption): boolean {
  return option.received === true;
}

export function isDangerous(option: SkillCornerPassingOption): boolean {
  return option.dangerous === true;
}

// --- Player possessions ----------------------------------------------------

/**
 * A completed pass out of this possession.
 *
 * Unlike StatsBomb — where success is the *absence* of `pass.outcome` —
 * SkillCorner writes the outcome explicitly, so this really is an equality
 * check and not a trap.
 */
export function isCompletePass(possession: SkillCornerPlayerPossession): boolean {
  return possession.pass_outcome === "successful";
}

export function isCarry(possession: SkillCornerPlayerPossession): boolean {
  return possession.carry === true;
}

export function isOneTouch(possession: SkillCornerPlayerPossession): boolean {
  return possession.one_touch === true;
}

// --- Tracking --------------------------------------------------------------

/** The position was seen by the camera, not extrapolated between sightings. */
export function isDetected(player: SkillCornerTrackedPlayer): boolean {
  return player.is_detected;
}

// --- Phases ----------------------------------------------------------------

export function isPhaseType(type: string) {
  return (phase: SkillCornerPhase): boolean => phase.team_in_possession_phase_type === type;
}

export function phaseLedToShot(phase: SkillCornerPhase): boolean {
  return phase.team_possession_lead_to_shot === true;
}

export function phaseLedToGoal(phase: SkillCornerPhase): boolean {
  return phase.team_possession_lead_to_goal === true;
}
