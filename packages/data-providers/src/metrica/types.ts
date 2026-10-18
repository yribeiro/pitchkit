/**
 * Metrica Sports sample-data shapes. Every column Metrica publishes keeps its
 * own header as the field name, spaces and units included: `"Start Frame"`,
 * `"Time [s]"`, `From`. Their event-definitions document therefore reads
 * against these types with no mapping table in between.
 *
 * What this package adds is lowercase, so the two are never confused: lifted
 * coordinates (`x`, `y`, `endX`, `endY`), and on a tracking frame the `ball`
 * and `players` that the wide CSV spreads across 60-odd columns.
 *
 * @see https://github.com/metrica-sports/sample-data
 */

/**
 * A literal union that still accepts any string, so editors autocomplete the
 * values Metrica ships without the type claiming to be exhaustive.
 * `Record<never, never>` rather than `{}` keeps `no-empty-object-type` quiet.
 */
export type Known<T extends string> = T | (string & Record<never, never>);

/**
 * The sample games are anonymised: teams are only ever `"Home"` and `"Away"`,
 * and players only `"Player1"` to `"Player28"`.
 */
export type MetricaTeam = Known<"Home" | "Away">;

/** The nine event types in Metrica's event definitions. */
export type MetricaEventType = Known<
  | "SET PIECE"
  | "RECOVERY"
  | "PASS"
  | "BALL LOST"
  | "BALL OUT"
  | "SHOT"
  | "FAULT RECEIVED"
  | "CHALLENGE"
  | "CARD"
>;

/** A point on Metrica's `0..1` grid: origin top-left, y increasing downward. */
export interface MetricaPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * One row of a `RawEventsData.csv` file.
 *
 * **Coordinates are absolute.** Teams swap ends at half time, and which end
 * each starts at differs between the two games, so a team's shots sit near
 * `x = 1` in one half and near `x = 0` in the other. See
 * `attackingDirection`.
 *
 * Start and end positions can fall slightly outside `0..1`: a shot that goes
 * in ends at `x = 1.01` or `-0.02`, because the ball crossed the goal line.
 */
export interface MetricaEvent {
  readonly Team: MetricaTeam;
  readonly Type: MetricaEventType;
  /**
   * Hyphen-joined qualifiers, or `null` when the event has none. A header
   * that scores is `"HEAD-ON TARGET-GOAL"`: three subtypes, one of which
   * contains a space. `hasSubtype` reads them.
   */
  readonly Subtype: string | null;
  /** `1` or `2`. The sample games have no extra time. */
  readonly Period: number;
  /** The tracking frame this event starts on. Events and tracking share a clock. */
  readonly "Start Frame": number;
  /** Seconds since kick-off, continuous across both halves. */
  readonly "Start Time [s]": number;
  /** `0` on the opening kick-off of Sample Game 1; elsewhere a real frame. */
  readonly "End Frame": number;
  readonly "End Time [s]": number;
  /**
   * The player the event belongs to, spelled as in the tracking header. Set
   * on every event in both sample games.
   */
  readonly From: string | null;
  /** The receiving player. Set on every `PASS` and on nothing else. */
  readonly To: string | null;
  /**
   * `null` where the file has `NaN`, which is every `SET PIECE` and `CARD`.
   * The event after a set piece (usually its `PASS`) carries the position.
   */
  readonly "Start X": number | null;
  readonly "Start Y": number | null;
  /**
   * `null` where the file has `NaN`: every `RECOVERY`, `CHALLENGE`,
   * `FAULT RECEIVED`, `SET PIECE` and `CARD`, and some `BALL LOST`.
   */
  readonly "End X": number | null;
  readonly "End Y": number | null;

  /** `"Start X"`, lifted for a PitchKit accessor. Absent where that is `null`. */
  readonly x?: number;
  /** `"Start Y"`, lifted. Absent wherever `x` is. */
  readonly y?: number;
  /** `"End X"`, lifted. Absent where that is `null`. */
  readonly endX?: number;
  /** `"End Y"`, lifted. Absent wherever `endX` is. */
  readonly endY?: number;

  readonly [key: string]: unknown;
}

/** One player's position in one frame. */
export interface MetricaTrackedPlayer {
  /** From the file's first header row: `"Home"` or `"Away"`. */
  readonly team: MetricaTeam;
  /**
   * The column header, verbatim, which is what an event's `From` and `To`
   * hold. Usually `"Player11"`, but Sample Game 2 spells one away player
   * `"Player 26"`, with a space, in both its tracking and events files, so
   * don't normalise it.
   */
  readonly player: string;
  /** From the file's second header row; `null` if that cell is blank. */
  readonly jersey: number | null;
  readonly x: number;
  readonly y: number;
}

/**
 * One tracking frame, at 25 frames per second, with both teams merged.
 *
 * Metrica ship each team in its own file. The two are row-aligned (every
 * frame appears in both, in the same order) and both carry the same ball
 * columns.
 */
export interface MetricaFrame {
  readonly Period: number;
  readonly Frame: number;
  /** Seconds since kick-off, continuous across both halves. */
  readonly "Time [s]": number;
  /**
   * `null` when the ball wasn't tracked, which is often: about 40% of frames
   * in both sample games, mostly while play is stopped.
   */
  readonly ball: MetricaPoint | null;
  /**
   * The players on the pitch in this frame, home side first. A player whose
   * position is `NaN` (a substitute not yet on, or one already off) is left
   * out rather than included with null coordinates.
   */
  readonly players: readonly MetricaTrackedPlayer[];
}
