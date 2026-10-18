/**
 * Metrica Sports sample-data loader: two anonymised games of synchronised
 * tracking and event data.
 *
 * ```ts
 * import { fetchEvents, fetchTrackingWindow, isGoal, shots } from "@pitchkit/data-providers/metrica";
 *
 * const goal = shots(await fetchEvents(1)).find(isGoal)!;
 * const frames = await fetchTrackingWindow(1, {
 *   fromFrame: goal["Start Frame"],
 *   toFrame: goal["End Frame"],
 * });
 * ```
 *
 * The same four layers as the other providers: `parse*` (pure), `load*` /
 * `fetch*` / `stream*` (network), narrowing selectors, and composable
 * predicates. Three things to know before you plot anything:
 *
 * 1. **The grid is `0..1`, origin top-left, y downward.** Plot it with
 *    `<Pitch type="metrica">`. It is Wyscout's orientation at a hundredth of
 *    the scale, so neither type stands in for the other.
 * 2. **Coordinates are absolute.** Teams swap ends at half time, and which
 *    end each side starts at differs between the games. `attackingDirection`
 *    reads it off a kick-off frame.
 * 3. **Events and tracking share a clock.** An event's `"Start Frame"` is a
 *    tracking `Frame`, and its `From` is a tracked player's `player`. A
 *    game's tracking is two 32 MB files, one per team, so prefer
 *    `streamTracking` or `fetchTrackingWindow` over `fetchTracking`.
 *
 * Field names are Metrica's own CSV headers, spaces and units included
 * (`event["Start Frame"]`). What this package adds is lowercase.
 *
 * Metrica ask that anything public made from the data acknowledges them.
 *
 * @see https://github.com/metrica-sports/sample-data
 * @module metrica
 */

export type {
  Known,
  MetricaEvent,
  MetricaEventType,
  MetricaFrame,
  MetricaPoint,
  MetricaTeam,
  MetricaTrackedPlayer,
} from "./types.js";

export { parseEvents, parseTracking } from "./parse.js";

export {
  eventsUrl,
  fetchEvents,
  fetchTracking,
  fetchTrackingWindow,
  loadEvents,
  loadTracking,
  loadTrackingWindow,
  METRICA_SAMPLE_DATA_BASE_URL,
  METRICA_SAMPLE_GAMES,
  streamTracking,
  streamTrackingFrom,
  trackingUrls,
} from "./load.js";
export type { MetricaLoadOptions, MetricaTrackingUrls, TrackingWindowOptions } from "./load.js";

export {
  attackingDirection,
  byPlayer,
  byTeam,
  challenges,
  findPlayer,
  inPeriod,
  ofType,
  passes,
  playersOfTeam,
  setPieces,
  shots,
} from "./select.js";

export {
  hasEndLocation,
  hasLocation,
  hasSubtype,
  isBlocked,
  isClearance,
  isCornerKick,
  isCross,
  isFault,
  isFreeKick,
  isGoal,
  isGoalKick,
  isHeader,
  isKickOff,
  isOnTarget,
  isOwnGoal,
  isPenalty,
  isRedCard,
  isSaved,
  isThroughBall,
  isThrowIn,
  isWoodwork,
  isYellowCard,
  lostChallenge,
  subtypesOf,
  wonChallenge,
} from "./predicates.js";

// Re-exported so a consumer importing only this subpath can still catch and
// branch on failures without a second import from the package root.
export { DataProviderError } from "../errors.js";
export type { DataProviderErrorKind } from "../errors.js";
export type { LoadOptions } from "../fetch-json.js";
