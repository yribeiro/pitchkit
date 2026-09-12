import type {
  SkillCornerEvent,
  SkillCornerFrame,
  SkillCornerMatch,
  SkillCornerMatchPlayer,
  SkillCornerOffBallRun,
  SkillCornerOnBallEngagement,
  SkillCornerPassingOption,
  SkillCornerPlayerPossession,
  SkillCornerPhase,
  SkillCornerTrackedPlayer,
} from "./types.js";

/**
 * Guards and selectors — the only things here that narrow the event union.
 *
 * SkillCorner's discriminant is top level, so `event.event_type === "off_ball_run"`
 * narrows natively too (unlike StatsBomb's nested one). These guards go a step
 * further and confirm the row actually carries the fields the type promises.
 */

export function isPlayerPossession(event: SkillCornerEvent): event is SkillCornerPlayerPossession {
  return event.event_type === "player_possession";
}

export function isPassingOption(event: SkillCornerEvent): event is SkillCornerPassingOption {
  return event.event_type === "passing_option";
}

export function isOffBallRun(event: SkillCornerEvent): event is SkillCornerOffBallRun {
  return event.event_type === "off_ball_run";
}

export function isOnBallEngagement(event: SkillCornerEvent): event is SkillCornerOnBallEngagement {
  return event.event_type === "on_ball_engagement";
}

export function playerPossessions(
  events: readonly SkillCornerEvent[],
): SkillCornerPlayerPossession[] {
  return events.filter(isPlayerPossession);
}

export function passingOptions(events: readonly SkillCornerEvent[]): SkillCornerPassingOption[] {
  return events.filter(isPassingOption);
}

export function offBallRuns(events: readonly SkillCornerEvent[]): SkillCornerOffBallRun[] {
  return events.filter(isOffBallRun);
}

export function onBallEngagements(
  events: readonly SkillCornerEvent[],
): SkillCornerOnBallEngagement[] {
  return events.filter(isOnBallEngagement);
}

/** Everything of one type, including types this package doesn't model. */
export function ofEventType(events: readonly SkillCornerEvent[], type: string): SkillCornerEvent[] {
  return events.filter((event) => event.event_type === type);
}

// ---------------------------------------------------------------------------
// Joining tracking to the match
// ---------------------------------------------------------------------------

/**
 * Players by id, for putting names and teams onto tracked positions.
 *
 * Tracking frames carry only `player_id` — no name, number or team — so
 * anything that colours by team needs this lookup. Note the join is on
 * `players[].id`, **not** `trackable_object`, which is a different id space
 * and matches nothing in the tracking file.
 */
export function indexPlayersById(match: SkillCornerMatch): Map<number, SkillCornerMatchPlayer> {
  return new Map(match.players.map((player) => [player.id, player]));
}

/** The tracked players belonging to one team in a frame. */
export function playersOfTeam(
  frame: SkillCornerFrame,
  teamId: number,
  players: Map<number, SkillCornerMatchPlayer>,
): SkillCornerTrackedPlayer[] {
  return frame.player_data.filter((tracked) => players.get(tracked.player_id)?.team_id === teamId);
}

/** Positions the camera actually saw, as opposed to extrapolated estimates. */
export function detectedPlayers(frame: SkillCornerFrame): SkillCornerTrackedPlayer[] {
  return frame.player_data.filter((tracked) => tracked.is_detected);
}

/** Frames with the ball in play — period set and at least one tracked player. */
export function inPlayFrames(frames: readonly SkillCornerFrame[]): SkillCornerFrame[] {
  return frames.filter((frame) => frame.period !== null && frame.player_data.length > 0);
}

/** The frames belonging to one phase of play, by frame number. */
export function framesInPhase(
  frames: readonly SkillCornerFrame[],
  phase: SkillCornerPhase,
): SkillCornerFrame[] {
  return frames.filter(
    (frame) => frame.frame >= phase.frame_start && frame.frame <= phase.frame_end,
  );
}
