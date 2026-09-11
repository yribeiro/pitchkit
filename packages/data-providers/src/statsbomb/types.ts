/**
 * StatsBomb's open-data shapes, typed as they actually are on the wire.
 *
 * This package deliberately does **not** rename StatsBomb's fields or
 * translate its values into a PitchKit vocabulary: `outcome.name` is
 * `"Off T"`, not `"off-target"`, and keys stay `snake_case`. Anything you
 * read here can be cross-referenced against StatsBomb's own spec without a
 * mapping table in between, and everything interpretive lives in the
 * predicate helpers (`isGoal`, `isComplete`, ...) instead of in the data.
 *
 * The one exception is coordinates: `location` / `end_location` arrays are
 * *also* surfaced as `x`/`y`/`endX`/`endY` so they can be handed straight to
 * a PitchKit accessor (`<Scatter x={(d) => d.x} />`) without index-juggling.
 * The original arrays are left in place.
 */

/**
 * A literal union that still accepts values outside it. StatsBomb adds
 * outcomes and techniques over time, and a passthrough loader must not fail
 * to typecheck against next season's data — so the known values give
 * autocomplete while unknown ones remain assignable.
 */
type Known<T extends string> = T | (string & Record<never, never>);

/** StatsBomb's ubiquitous `{ id, name }` reference pair. */
export interface StatsBombRef<TName extends string = string> {
  readonly id: number;
  readonly name: Known<TName>;
}

export type PlayPattern =
  | "Regular Play"
  | "From Corner"
  | "From Free Kick"
  | "From Throw In"
  | "From Counter"
  | "From Goal Kick"
  | "From Keeper"
  | "From Kick Off"
  | "Other";

export type ShotOutcome =
  "Blocked" | "Goal" | "Off T" | "Post" | "Saved" | "Saved Off T" | "Saved To Post" | "Wayward";

export type ShotType = "Open Play" | "Free Kick" | "Penalty" | "Corner" | "Kick Off";

export type ShotBodyPart = "Head" | "Left Foot" | "Right Foot" | "Other";

export type PassOutcome = "Incomplete" | "Injury Clearance" | "Out" | "Pass Offside" | "Unknown";

export type PassHeight = "Ground Pass" | "Low Pass" | "High Pass";

export type PassType =
  "Corner" | "Free Kick" | "Goal Kick" | "Interception" | "Kick Off" | "Recovery" | "Throw-in";

export type PassBodyPart =
  "Drop Kick" | "Head" | "Keeper Arm" | "Left Foot" | "No Touch" | "Other" | "Right Foot";

/** One team-mate or opponent in a shot's freeze frame. */
export interface StatsBombFreezeFramePlayer {
  readonly location: readonly number[];
  readonly player: StatsBombRef;
  readonly position: StatsBombRef;
  readonly teammate: boolean;
}

/**
 * Fields present on every event, whatever its type.
 *
 * `x`/`y` are optional here because a handful of event types genuinely carry
 * no `location` — Starting XI, Half Start, Half End, Substitution, Tactical
 * Shift and Bad Behaviour. They are re-declared as **required** on the shot,
 * pass and carry types below, which always have one.
 */
export interface StatsBombBaseEvent {
  readonly id: string;
  readonly index: number;
  readonly period: number;
  readonly timestamp: string;
  readonly minute: number;
  readonly second: number;
  readonly type: StatsBombRef;
  readonly possession: number;
  readonly possession_team: StatsBombRef;
  readonly play_pattern: StatsBombRef<PlayPattern>;
  readonly team: StatsBombRef;
  readonly player?: StatsBombRef;
  readonly position?: StatsBombRef;
  readonly location?: readonly number[];
  readonly duration?: number;
  readonly under_pressure?: boolean;
  readonly counterpress?: boolean;
  readonly off_camera?: boolean;
  readonly out?: boolean;
  readonly related_events?: readonly string[];
  /** `location[0]`, lifted for direct use as a PitchKit x accessor. */
  readonly x?: number;
  /** `location[1]`, lifted for direct use as a PitchKit y accessor. */
  readonly y?: number;
}

export interface StatsBombShot extends StatsBombBaseEvent {
  readonly x: number;
  readonly y: number;
  /** `shot.end_location[0]`. */
  readonly endX: number;
  /** `shot.end_location[1]`. */
  readonly endY: number;
  /**
   * `shot.end_location[2]` — height above the goal line. Genuinely optional:
   * StatsBomb records a 2-element end location for shots that never left the
   * ground, and a 3-element one otherwise.
   */
  readonly endZ?: number;
  readonly shot: {
    readonly statsbomb_xg: number;
    readonly end_location: readonly number[];
    readonly outcome: StatsBombRef<ShotOutcome>;
    readonly type: StatsBombRef<ShotType>;
    readonly body_part: StatsBombRef<ShotBodyPart>;
    readonly technique?: StatsBombRef;
    readonly freeze_frame?: readonly StatsBombFreezeFramePlayer[];
    readonly first_time?: boolean;
    readonly one_on_one?: boolean;
    readonly aerial_won?: boolean;
    readonly deflected?: boolean;
    readonly open_goal?: boolean;
    readonly follows_dribble?: boolean;
    readonly redirect?: boolean;
    readonly saved_off_target?: boolean;
    readonly saved_to_post?: boolean;
    readonly key_pass_id?: string;
  };
}

export interface StatsBombPass extends StatsBombBaseEvent {
  readonly x: number;
  readonly y: number;
  /** `pass.end_location[0]`. */
  readonly endX: number;
  /** `pass.end_location[1]`. */
  readonly endY: number;
  readonly pass: {
    readonly end_location: readonly number[];
    readonly length: number;
    readonly angle: number;
    readonly height: StatsBombRef<PassHeight>;
    readonly recipient?: StatsBombRef;
    readonly body_part?: StatsBombRef<PassBodyPart>;
    readonly type?: StatsBombRef<PassType>;
    readonly technique?: StatsBombRef;
    /**
     * Absent on a completed pass — StatsBomb encodes success as the *lack*
     * of an outcome, not as an outcome value. Use `isComplete(pass)` rather
     * than testing this field directly.
     */
    readonly outcome?: StatsBombRef<PassOutcome>;
    readonly cross?: boolean;
    readonly through_ball?: boolean;
    readonly switch?: boolean;
    readonly cut_back?: boolean;
    readonly straight?: boolean;
    readonly inswinging?: boolean;
    readonly outswinging?: boolean;
    readonly deflected?: boolean;
    readonly miscommunication?: boolean;
    readonly aerial_won?: boolean;
    readonly no_touch?: boolean;
    readonly goal_assist?: boolean;
    readonly shot_assist?: boolean;
    readonly assisted_shot_id?: string;
  };
}

export interface StatsBombCarry extends StatsBombBaseEvent {
  readonly x: number;
  readonly y: number;
  /** `carry.end_location[0]`. */
  readonly endX: number;
  /** `carry.end_location[1]`. */
  readonly endY: number;
  readonly carry: {
    readonly end_location: readonly number[];
  };
}

/**
 * Every event type this package doesn't model explicitly — Duel, Dribble,
 * Goal Keeper, Pressure, Interception and the rest of StatsBomb's ~20 others.
 *
 * They are not dropped or flattened: the type-specific sub-object is still
 * there under its own key, reachable through the index signature. Typing more
 * of them is additive and non-breaking, so coverage can grow when a real use
 * case asks for it.
 */
export interface StatsBombGenericEvent extends StatsBombBaseEvent {
  readonly [key: string]: unknown;
}

export type StatsBombEvent = StatsBombShot | StatsBombPass | StatsBombCarry | StatsBombGenericEvent;

/**
 * One row of `competitions.json`. Note these are competition **and season**
 * pairs, not competitions — the same competition appears once per season it
 * covers, which is why `fetchMatches` needs both ids.
 */
export interface StatsBombCompetition {
  readonly competition_id: number;
  readonly season_id: number;
  readonly country_name: string;
  readonly competition_name: string;
  readonly competition_gender: string;
  readonly competition_youth: boolean;
  readonly competition_international: boolean;
  readonly season_name: string;
  readonly match_updated?: string;
  readonly match_available?: string | null;
  readonly match_updated_360?: string | null;
  readonly match_available_360?: string | null;
}

export interface StatsBombMatch {
  readonly match_id: number;
  readonly match_date: string;
  readonly kick_off?: string;
  readonly competition: {
    readonly competition_id: number;
    readonly country_name: string;
    readonly competition_name: string;
  };
  readonly season: { readonly season_id: number; readonly season_name: string };
  readonly home_team: { readonly home_team_id: number; readonly home_team_name: string };
  readonly away_team: { readonly away_team_id: number; readonly away_team_name: string };
  readonly home_score: number;
  readonly away_score: number;
  readonly match_status?: string;
  /**
   * Whether *this specific match* has 360 tracking data available —
   * `"available"` if `fetchMatchThreeSixty`/`matchThreeSixtyUrl` will
   * resolve. A competition can have 360 data for some of its matches and
   * not others (`StatsBombCompetition.match_available_360` only says the
   * competition has *some* coverage).
   */
  readonly match_status_360?: string;
  readonly match_week?: number;
  readonly competition_stage?: StatsBombRef;
  readonly stadium?: StatsBombRef;
  readonly referee?: StatsBombRef;
}

export interface StatsBombLineupPlayer {
  readonly player_id: number;
  readonly player_name: string;
  readonly player_nickname: string | null;
  readonly jersey_number: number;
  readonly country?: StatsBombRef;
  readonly cards?: readonly unknown[];
  readonly positions?: readonly unknown[];
}

export interface StatsBombLineup {
  readonly team_id: number;
  readonly team_name: string;
  readonly lineup: readonly StatsBombLineupPlayer[];
}

/**
 * One tracked player in a 360 freeze frame.
 *
 * Distinct from `StatsBombFreezeFramePlayer` (the freeze frame nested inside
 * `shot.freeze_frame` in the *events* file): this one carries no player
 * identity at all — 360 is optical tracking, not event annotation — just
 * `teammate`/`actor`/`keeper` flags relative to the frame's acting player,
 * plus a location.
 */
export interface StatsBombThreeSixtyPlayer {
  /** Relative to the event's team — `false` means an opponent, not "unknown team". */
  readonly teammate: boolean;
  /** The player who performed the event this frame belongs to. */
  readonly actor: boolean;
  readonly keeper: boolean;
  readonly location: readonly number[];
  /** `location[0]`, lifted for direct use as a PitchKit x accessor. */
  readonly x: number;
  /** `location[1]`, lifted for direct use as a PitchKit y accessor. */
  readonly y: number;
}

/**
 * One row of a match's `three-sixty/{match_id}.json` file — StatsBomb's
 * optical tracking data: every player the broadcast camera could see at the
 * moment of one event.
 *
 * `event_uuid` is the matching `StatsBombEvent`'s `id` — join the two files
 * with `indexThreeSixtyByEvent`. Not every event has a frame — coverage
 * varies by match (85% of events in one sampled World Cup match, for
 * instance) since 360 tracking only runs on events with a camera view
 * (StatsBomb's own coverage, not something this package filters) — so
 * always check the join rather than assuming one exists.
 */
export interface StatsBombThreeSixtyFrame {
  readonly event_uuid: string;
  /**
   * The pitch area the broadcast camera actually covered for this frame —
   * a polygon as StatsBomb encodes it, a flat `[x0, y0, x1, y1, ...]` list
   * of vertex pairs rather than `[[x, y], ...]`. `freeze_frame` only lists
   * players StatsBomb could see inside it. Use `visibleAreaPolygon` to get
   * point pairs for a PitchKit `Polygon` layer.
   */
  readonly visible_area: readonly number[];
  readonly freeze_frame: readonly StatsBombThreeSixtyPlayer[];
}
