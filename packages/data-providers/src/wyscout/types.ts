/**
 * Wire shapes for Wyscout's public event data, as published in the
 * Pappalardo et al. dataset. Field names and values are Wyscout's own —
 * `eventId`, `subEventName`, `matchPeriod`, `wyId` — so their documentation
 * reads against these types with no mapping table in between.
 *
 * The one addition is coordinates: `positions` entries are *also* surfaced as
 * `x`/`y`/`endX`/`endY` so they can be handed straight to a PitchKit accessor
 * (`<Scatter x={(d) => d.x} />`). The original array is left in place.
 */

/**
 * A literal union that still accepts an unrecognised string.
 *
 * Wyscout's vocabularies are fixed in this dataset, but a mirror or a future
 * export could carry a value we don't list, and a hard union would make that
 * a type error for the caller rather than data they can inspect.
 */
export type Known<T extends string> = T | (string & Record<never, never>);

/** The ten top-level event types in the dataset. */
export type WyscoutEventName = Known<
  | "Pass"
  | "Duel"
  | "Foul"
  | "Free Kick"
  | "Shot"
  | "Save attempt"
  | "Offside"
  | "Interruption"
  | "Others on the ball"
  | "Goalkeeper leaving line"
>;

/** `1H`/`2H` for regulation, `E1`/`E2` for extra time, `P` for penalties. */
export type WyscoutMatchPeriod = Known<"1H" | "2H" | "E1" | "E2" | "P">;

/**
 * A tag id. Wyscout puts every piece of interpretation here rather than in
 * fields — whether a pass found its target, whether a shot was a goal, which
 * foot took it — so `hasTag` and the named predicates are the reading layer.
 * See `WYSCOUT_TAGS` for the full vocabulary.
 */
export interface WyscoutTag {
  readonly id: number;
}

/** A point on Wyscout's 0-100 grid. Note `y` before `x` in the raw JSON. */
export interface WyscoutPosition {
  readonly x: number;
  readonly y: number;
}

export interface WyscoutEvent {
  /** Unique event id. */
  readonly id: number;
  readonly matchId: number;
  readonly teamId: number;
  /** `0` when no player is credited (some interruptions). */
  readonly playerId: number;
  readonly eventId: number;
  readonly eventName: WyscoutEventName;
  readonly subEventId: number | string;
  readonly subEventName: string;
  readonly matchPeriod: WyscoutMatchPeriod;
  /** Seconds since the start of this period, not of the match. */
  readonly eventSec: number;
  readonly tags: readonly WyscoutTag[];
  /**
   * Start and (usually) end point. Almost always two entries; a handful of
   * fouls carry one.
   *
   * **Coordinates are normalised to the attacking direction**, not absolute:
   * `x: 100` is always the goal the event's team is attacking, in both
   * halves. Both teams therefore appear to attack left-to-right, and nothing
   * flips at half time.
   */
  readonly positions: readonly WyscoutPosition[];

  /** `positions[0].x`, lifted for direct use as a PitchKit x accessor. */
  readonly x: number;
  /** `positions[0].y`, lifted for direct use as a PitchKit y accessor. */
  readonly y: number;
  /**
   * `positions[1].x`, lifted — **absent for `Shot`, `Interruption` and
   * `Offside`**, where Wyscout never records a real end location. See
   * `hasEndLocation`.
   */
  readonly endX?: number;
  /** `positions[1].y`, lifted. Absent wherever `endX` is. */
  readonly endY?: number;

  readonly [key: string]: unknown;
}

/** An area, as Wyscout spells it — `id` is a string on some records. */
export interface WyscoutArea {
  readonly id: number | string;
  readonly name: string;
  readonly alpha2code: string;
  readonly alpha3code: string;
}

export interface WyscoutTeam {
  readonly wyId: number;
  readonly name: string;
  readonly officialName: string;
  readonly city: string;
  readonly type: Known<"club" | "national">;
  readonly area: WyscoutArea;
  readonly [key: string]: unknown;
}

export interface WyscoutPlayerRole {
  readonly code2: Known<"GK" | "DF" | "MD" | "FW">;
  readonly code3: string;
  readonly name: string;
}

export interface WyscoutPlayer {
  readonly wyId: number;
  readonly shortName: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleName: string;
  readonly birthDate: string | null;
  readonly height: number;
  readonly weight: number;
  readonly foot: Known<"left" | "right" | "both" | "">;
  readonly role: WyscoutPlayerRole;
  readonly currentTeamId: number | null;
  readonly [key: string]: unknown;
}

/** One entry of a team's squad list in a per-match file. */
export interface WyscoutMatchPlayer {
  readonly playerId: number;
  readonly player: WyscoutPlayer;
}

export interface WyscoutCompetition {
  readonly wyId: number;
  readonly name: string;
  readonly format: string;
  readonly type: Known<"club" | "international">;
  readonly area: WyscoutArea;
  readonly [key: string]: unknown;
}

/**
 * A whole match file: the events, plus the two teams and their squads.
 *
 * The teams and players are bundled per match by the mirror this package
 * fetches from, which is why one request is enough to label a chart.
 */
export interface WyscoutMatch {
  readonly events: readonly WyscoutEvent[];
  /** Keyed by team id, as a string — JSON object keys always are. */
  readonly teams: Readonly<Record<string, WyscoutTeam>>;
  /** Keyed by team id, as a string. */
  readonly players: Readonly<Record<string, readonly WyscoutMatchPlayer[]>>;
}
