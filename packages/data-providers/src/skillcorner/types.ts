/**
 * SkillCorner open-data shapes, keeping SkillCorner's own field names and
 * values throughout — `attacking_side` stays `"left_to_right"`, an event type
 * stays `"off_ball_run"`. Nothing is re-spelled, so their documentation reads
 * against these types with no mapping table in between.
 *
 * @see https://github.com/SkillCorner/opendata
 */

/**
 * A literal union that still accepts anything — so editors autocomplete the
 * values SkillCorner actually ships without the type claiming to be
 * exhaustive. `Record<never, never>` rather than `{}` keeps
 * `no-empty-object-type` quiet.
 */
export type Known<T extends string> = T | (string & Record<never, never>);

/** Which way a team is attacking, in absolute pitch terms. */
export type SkillCornerSide = Known<"left_to_right" | "right_to_left">;

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

export interface SkillCornerTeamRef {
  readonly id: number;
  readonly short_name: string;
  readonly name?: string;
  readonly acronym?: string;
}

/** A row of the top-level `matches.json` index. */
export interface SkillCornerMatchSummary {
  readonly id: number;
  readonly date_time: string;
  readonly home_team: SkillCornerTeamRef;
  readonly away_team: SkillCornerTeamRef;
  readonly status: string;
  readonly competition_id: number;
  readonly season_id: number;
  readonly [key: string]: unknown;
}

export interface SkillCornerPeriod {
  readonly period: number;
  readonly name: string;
  readonly start_frame: number;
  readonly end_frame: number;
  readonly duration_frames: number;
  readonly duration_minutes: number;
}

export interface SkillCornerPlayerRole {
  readonly id: number;
  readonly name: string;
  readonly acronym: string;
  readonly position_group: string;
}

export interface SkillCornerMatchPlayer {
  /** The id tracking frames join on — **not** `trackable_object`. */
  readonly id: number;
  readonly team_id: number;
  readonly first_name: string;
  readonly last_name: string;
  readonly short_name: string;
  readonly number: number | null;
  readonly player_role: SkillCornerPlayerRole | null;
  readonly [key: string]: unknown;
}

/**
 * A match's metadata file.
 *
 * `pitch_length`/`pitch_width` are the **real dimensions of that stadium's
 * pitch**, and they genuinely vary across the open dataset — 104, 105 and 106
 * metres all appear. Coordinates are in those metres, so anything converting
 * them has to read the values off the match rather than assume 105x68.
 */
export interface SkillCornerMatch {
  readonly id: number;
  readonly home_team: SkillCornerTeamRef;
  readonly away_team: SkillCornerTeamRef;
  readonly home_team_score: number;
  readonly away_team_score: number;
  readonly date_time: string;
  readonly pitch_length: number;
  readonly pitch_width: number;
  readonly match_periods: readonly SkillCornerPeriod[];
  /** Which way the **home** team attacks, indexed by period (0 = first half). */
  readonly home_team_side: readonly SkillCornerSide[];
  readonly players: readonly SkillCornerMatchPlayer[];
  readonly [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

export interface SkillCornerBall {
  readonly x: number | null;
  readonly y: number | null;
  readonly z: number | null;
  readonly is_detected: boolean | null;
}

export interface SkillCornerTrackedPlayer {
  /** Joins to `SkillCornerMatch.players[].id`. */
  readonly player_id: number;
  /** Metres from the centre spot, along the pitch's length. */
  readonly x: number;
  /** Metres from the centre spot, across the pitch's width. */
  readonly y: number;
  /**
   * `false` means this position was **extrapolated**, not seen. Broadcast
   * tracking only covers what the camera framed — across a sampled match only
   * about 65% of player positions were true detections — so an extrapolated
   * position is an estimate, not a measurement.
   */
  readonly is_detected: boolean;
  /** Corner-origin metres, added by the parser. See `coordinates.ts`. */
  readonly pitchX: number;
  readonly pitchY: number;
}

/**
 * One 10 fps tracking frame.
 *
 * Frames before kickoff and during stoppages carry nulls throughout with an
 * empty `player_data` — that is the file's own shape, not a parse failure.
 *
 * **Tracking positions are absolute**: a team's coordinates flip sign at half
 * time, per `SkillCornerMatch.home_team_side`. This is the opposite of the
 * dynamic-events file, whose x is normalised so positive always points at the
 * goal being attacked. Confusing the two silently mirrors half a match, so the
 * distinction is modelled rather than smoothed over.
 */
export interface SkillCornerFrame {
  readonly frame: number;
  readonly timestamp: string | null;
  readonly period: number | null;
  readonly ball_data: SkillCornerBall;
  readonly possession: {
    readonly player_id: number | null;
    readonly group: string | null;
  };
  readonly player_data: readonly SkillCornerTrackedPlayer[];
  /** Ball position in corner-origin metres; null when the ball wasn't located. */
  readonly ballPitchX: number | null;
  readonly ballPitchY: number | null;
  readonly [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Dynamic events
// ---------------------------------------------------------------------------

export type SkillCornerEventType = Known<
  "player_possession" | "passing_option" | "off_ball_run" | "on_ball_engagement"
>;

/**
 * The fields shared by every dynamic-event row.
 *
 * The source CSV carries **322 columns**. The ones below are typed because
 * they are the ones you plot or filter on; every other column stays reachable
 * through the index signature under its original name, as the string the CSV
 * held. Typing all 322 would be a worse lie than leaving them honest.
 */
export interface SkillCornerEventBase {
  readonly event_id: string;
  readonly index: number;
  readonly match_id: number;
  readonly event_type: SkillCornerEventType;
  readonly event_subtype: string | null;

  readonly frame_start: number;
  readonly frame_end: number | null;
  readonly time_start: string | null;
  readonly time_end: string | null;
  readonly minute_start: number | null;
  readonly second_start: number | null;
  readonly duration: number | null;
  readonly period: number | null;

  readonly team_id: number | null;
  readonly team_shortname: string | null;
  readonly attacking_side: SkillCornerSide | null;
  readonly player_id: number | null;
  readonly player_name: string | null;
  readonly player_position: string | null;

  /**
   * Metres from the centre spot, but **normalised to the attacking
   * direction**: positive x always points at the goal this team is attacking,
   * in both halves. Unlike tracking coordinates these never flip at half time.
   */
  readonly x_start: number | null;
  readonly y_start: number | null;
  readonly x_end: number | null;
  readonly y_end: number | null;
  readonly channel_start: string | null;
  readonly third_start: string | null;
  readonly channel_end: string | null;
  readonly third_end: string | null;
  readonly penalty_area_start: boolean | null;
  readonly penalty_area_end: boolean | null;

  /** Corner-origin metres, added by the parser, for direct plotting. */
  readonly pitchX: number | null;
  readonly pitchY: number | null;
  readonly pitchEndX: number | null;
  readonly pitchEndY: number | null;

  readonly phase_index: number | null;
  readonly lead_to_shot: boolean | null;
  readonly lead_to_goal: boolean | null;
  readonly xthreat: number | null;

  /** Every other column, as the CSV spelled it. */
  readonly [key: string]: unknown;
}

/** A player's time on the ball. */
export interface SkillCornerPlayerPossession extends SkillCornerEventBase {
  readonly event_type: "player_possession";
  readonly carry: boolean | null;
  readonly one_touch: boolean | null;
  readonly pass_outcome: string | null;
  readonly pass_distance: number | null;
  readonly pass_angle: number | null;
  readonly is_header: boolean | null;
}

/** A team-mate available to receive — SkillCorner's passing-option model. */
export interface SkillCornerPassingOption extends SkillCornerEventBase {
  readonly event_type: "passing_option";
  readonly targeted: boolean | null;
  readonly received: boolean | null;
  readonly dangerous: boolean | null;
  readonly difficult_pass_target: boolean | null;
  readonly xpass_completion: number | null;
  readonly pass_angle: number | null;
}

/** An off-the-ball movement, with its own distance and speed measures. */
export interface SkillCornerOffBallRun extends SkillCornerEventBase {
  readonly event_type: "off_ball_run";
  readonly distance_covered: number | null;
  readonly speed_avg: number | null;
  readonly speed_avg_band: string | null;
  readonly break_defensive_line: boolean | null;
  readonly intended_run_behind: boolean | null;
}

/** A defensive engagement — pressure, press, duel. */
export interface SkillCornerOnBallEngagement extends SkillCornerEventBase {
  readonly event_type: "on_ball_engagement";
  readonly interplayer_distance: number | null;
  readonly pressing_chain: boolean | null;
  readonly angle_of_engagement: number | null;
}

/** Any event type this package doesn't model explicitly. */
export interface SkillCornerOtherEvent extends SkillCornerEventBase {
  readonly event_type: Exclude<
    SkillCornerEventType,
    "player_possession" | "passing_option" | "off_ball_run" | "on_ball_engagement"
  >;
}

/**
 * The dynamic-events union.
 *
 * Unlike StatsBomb's, this discriminant is **top level**, so
 * `if (event.event_type === "off_ball_run")` narrows natively. The guards in
 * `select.ts` exist anyway, because they also confirm the row really carries
 * what that type implies.
 */
export type SkillCornerEvent =
  | SkillCornerPlayerPossession
  | SkillCornerPassingOption
  | SkillCornerOffBallRun
  | SkillCornerOnBallEngagement
  | SkillCornerOtherEvent;

// ---------------------------------------------------------------------------
// Phases of play
// ---------------------------------------------------------------------------

/** A stretch of the match with the ball in play and one team in possession. */
export interface SkillCornerPhase {
  readonly index: number;
  readonly match_id: number;
  readonly frame_start: number;
  readonly frame_end: number;
  readonly time_start: string | null;
  readonly time_end: string | null;
  readonly minute_start: number | null;
  readonly second_start: number | null;
  readonly duration: number | null;
  readonly period: number | null;
  readonly attacking_side: SkillCornerSide | null;
  readonly team_in_possession_id: number | null;
  readonly team_in_possession_shortname: string | null;
  readonly team_in_possession_phase_type: string | null;
  readonly team_out_of_possession_phase_type: string | null;
  readonly team_possession_lead_to_shot: boolean | null;
  readonly team_possession_lead_to_goal: boolean | null;
  readonly x_start: number | null;
  readonly y_start: number | null;
  readonly x_end: number | null;
  readonly y_end: number | null;
  readonly team_in_possession_width_start: number | null;
  readonly team_in_possession_length_start: number | null;
  readonly [key: string]: unknown;
}
