/**
 * Wire shapes for Impect's open data, Bundesliga 2023/24. Field names and
 * values are Impect's own (`actionType`, `adjCoordinates`, `squadId`,
 * `"LOOSE_BALL_REGAIN"`), so their documentation reads against these types
 * with no mapping table in between.
 *
 * The one addition is coordinates: each event's adjusted start and end are
 * *also* surfaced as `x`/`y`/`endX`/`endY`, so they can be handed straight to
 * a PitchKit accessor. The original objects are left in place.
 *
 * @see https://github.com/ImpectAPI/open-data
 */

/**
 * A literal union that still accepts an unrecognised string, so editors
 * autocomplete Impect's values without the type claiming to be exhaustive.
 * `Record<never, never>` rather than `{}` keeps `no-empty-object-type` quiet.
 */
export type Known<T extends string> = T | (string & Record<never, never>);

/** Impect's cross-references to other providers' ids, per entity. */
export type ImpectIdMappings = readonly Readonly<Record<string, readonly string[]>>[];

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

/** A competition season. The open data has one: Bundesliga 2023/24, id 743. */
export interface ImpectIteration {
  readonly id: number;
  readonly season: string;
  readonly competition: {
    readonly id: number;
    readonly name: string;
    readonly type: string;
    readonly countryId: number;
    readonly gender: string;
  };
  readonly dataVersion: string;
  readonly idMappings: ImpectIdMappings;
  readonly [key: string]: unknown;
}

/**
 * A row of an iteration's match list. **There is no score here**: count the
 * `GOAL` and `OWN_GOAL` events instead (see `isGoal` and `isOwnGoal`).
 */
export interface ImpectMatchSummary {
  readonly id: number;
  readonly iterationId: number;
  readonly homeSquadId: number;
  readonly awaySquadId: number;
  readonly scheduledDate: string;
  readonly matchDay: { readonly index: number; readonly name: string };
  readonly available: boolean;
  readonly idMappings: ImpectIdMappings;
  readonly [key: string]: unknown;
}

/** A club, as Impect calls a team. Events refer to it by `squadId`. */
export interface ImpectSquad {
  readonly id: number;
  readonly name: string;
  readonly countryId: number;
  readonly type: string;
  readonly gender: string;
  readonly imageUrl: string | null;
  readonly idMappings: ImpectIdMappings;
  readonly [key: string]: unknown;
}

export interface ImpectPlayer {
  readonly id: number;
  readonly firstname: string | null;
  readonly lastname: string | null;
  readonly commonname: string | null;
  readonly birthdate: string | null;
  readonly leg: Known<"LEFT" | "RIGHT" | "BOTH"> | null;
  readonly currentSquadId: number | null;
  readonly idMappings: ImpectIdMappings;
  readonly [key: string]: unknown;
}

/** The match clock as Impect write it. See `matchSeconds` before sorting on it. */
export interface ImpectGameTime {
  /** `"MM:SS.ffff"`, with stoppage time appended: `"45:00.0000 (+03:01.3990)"`. */
  readonly gameTime: string;
  /**
   * Seconds within the period, offset by period: **the second half starts at
   * 10,000**, and the two halves of extra time at 20,000 and 30,000. Dividing
   * it by 60 does not give a minute after half time.
   */
  readonly gameTimeInSec: number;
}

export interface ImpectLineupSquad {
  readonly id: number;
  readonly players: readonly { readonly id: number; readonly shirtNumber: number | null }[];
  readonly startingPositions: readonly {
    readonly playerId: number;
    readonly position: string;
    readonly positionSide: string;
  }[];
  readonly substitutions: readonly {
    readonly gameTime: ImpectGameTime;
    readonly playerId: number;
    readonly fromPosition: string;
    readonly toPosition: string;
    readonly [key: string]: unknown;
  }[];
  readonly startingFormation: string | null;
  readonly [key: string]: unknown;
}

/** A match's lineups file: both squads' players, starting positions and changes. */
export interface ImpectLineups {
  readonly id: number;
  readonly iterationId: number;
  readonly dateTime: string;
  readonly squadHome: ImpectLineupSquad;
  readonly squadAway: ImpectLineupSquad;
  readonly [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** The action types in the open data. */
export type ImpectActionType = Known<
  | "PASS"
  | "RECEPTION"
  | "DRIBBLE"
  | "SHOT"
  | "GOAL"
  | "OWN_GOAL"
  | "LOOSE_BALL_REGAIN"
  | "INTERCEPTION"
  | "CLEARANCE"
  | "BLOCK"
  | "GROUND_DUEL"
  | "FOUL"
  | "OFFSIDE"
  | "OUT"
  | "CORNER"
  | "FREE_KICK"
  | "THROW_IN"
  | "GOAL_KICK"
  | "KICK_OFF"
  | "GK_CATCH"
  | "GK_SAVE"
  | "REFEREE_INTERCEPTION"
  | "NO_VIDEO"
  | "FINAL_WHISTLE"
>;

/** A point on Impect's grid: metres from the centre spot, y increasing to the left. */
export interface ImpectPoint {
  readonly x: number;
  readonly y: number;
}

/** Where an event started or ended, in both of Impect's frames. */
export interface ImpectLocation {
  /**
   * **Absolute**, as seen on the TV pictures: teams swap ends at half time,
   * and which end each starts at varies by match.
   */
  readonly coordinates: ImpectPoint;
  /**
   * Turned so the **acting** team attacks towards `+x`, in both halves. That
   * is the team in `squadId`, not `currentAttackingSquadId`: a defender's
   * clearance is seen from the defender's side.
   */
  readonly adjCoordinates: ImpectPoint;
  readonly packingZone: string | null;
  readonly pitchPosition: string | null;
  readonly lane: string | null;
}

export interface ImpectEvent {
  /** Position in the match's event list. */
  readonly index: number;
  readonly id: number;
  readonly gameTime: ImpectGameTime;
  /** `1` and `2` for the halves, `3` and `4` for extra time. */
  readonly periodId: number;
  /** The team of the player on the ball, which is not always the team in possession. */
  readonly squadId: number | null;
  readonly currentAttackingSquadId: number | null;
  readonly player: {
    readonly id: number;
    readonly position: string;
    readonly positionSide: string;
  } | null;
  readonly actionType: ImpectActionType;
  /** A finer description of the action: `"LOW_PASS"`, `"HEADER"`, `"PENALTY_KICK"`. */
  readonly action: string | null;
  /**
   * `"SUCCESS"`, `"FAIL"`, or for a pass `"NEUTRAL"` (the receiver was under
   * high pressure, or a foul followed). `null` on events without an outcome.
   * On a shot, `"SUCCESS"` is a goal.
   */
  readonly result: Known<"SUCCESS" | "FAIL" | "NEUTRAL"> | null;
  /**
   * `null` on every `GOAL`, `OWN_GOAL`, `FOUL`, `OFFSIDE`, `NO_VIDEO`,
   * `REFEREE_INTERCEPTION` and `FINAL_WHISTLE`.
   */
  readonly start: ImpectLocation | null;
  readonly end: ImpectLocation | null;
  readonly bodyPart: string | null;
  /**
   * Set on every ball played on purpose, which includes corners, free kicks,
   * throw-ins, goal kicks and kick-offs as well as `PASS` events.
   */
  readonly pass: {
    readonly distance: number;
    readonly angle: number;
    readonly receiver: { readonly playerId: number | null; readonly type: string } | null;
    readonly [key: string]: unknown;
  } | null;
  readonly shot: {
    readonly distance: number;
    readonly angle: number;
    /**
     * Where the shot would have crossed the goal line, in metres: `y` from
     * `-3.66` (right post, from the shooter's view) to `+3.66`, the same way
     * round as the pitch's adjusted y, and `z` up from the ground. `null` or
     * absent on about two shots in three.
     */
    readonly targetPoint?: { readonly y: number; readonly z: number } | null;
    readonly [key: string]: unknown;
  } | null;
  readonly duel: { readonly duelType: string; readonly playerId: number | null } | null;
  readonly setPiece: { readonly id: number; readonly mainEvent: boolean } | null;

  /** `start.adjCoordinates.x`, lifted for a PitchKit accessor. Absent with no `start`. */
  readonly x?: number;
  /** `start.adjCoordinates.y`, lifted. Absent wherever `x` is. */
  readonly y?: number;
  /** `end.adjCoordinates.x`, lifted. Absent with no `end`. */
  readonly endX?: number;
  /** `end.adjCoordinates.y`, lifted. Absent wherever `endX` is. */
  readonly endY?: number;

  readonly [key: string]: unknown;
}
