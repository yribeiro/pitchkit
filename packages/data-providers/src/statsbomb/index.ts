/**
 * StatsBomb open-data loader.
 *
 * ```ts
 * import { fetchMatchEvents, shots, isGoal } from "@pitchkit/data-providers/statsbomb";
 *
 * const events = await fetchMatchEvents(15946);
 * const goals = shots(events).filter(isGoal);
 * ```
 *
 * Four layers, each usable on its own: `parse*` (pure, no network),
 * `load*`/`fetch*` (network), `shots`/`passes`/`carries` (narrowing
 * selectors) and the `is*` predicates (composable filters).
 *
 * 360 optical tracking data follows the same pattern —
 * `parseThreeSixty`/`fetchMatchThreeSixty`, joined to events with
 * `indexThreeSixtyByEvent` — but only exists for matches StatsBomb has
 * tracked; check `match.match_status_360 === "available"` first.
 *
 * @module statsbomb
 */

export type {
  PassBodyPart,
  PassHeight,
  PassOutcome,
  PassType,
  PlayPattern,
  ShotBodyPart,
  ShotOutcome,
  ShotType,
  StatsBombBaseEvent,
  StatsBombCarry,
  StatsBombCompetition,
  StatsBombEvent,
  StatsBombFreezeFramePlayer,
  StatsBombGenericEvent,
  StatsBombLineup,
  StatsBombLineupPlayer,
  StatsBombMatch,
  StatsBombPass,
  StatsBombRef,
  StatsBombShot,
  StatsBombThreeSixtyFrame,
  StatsBombThreeSixtyPlayer,
} from "./types.js";

export {
  parseCompetitions,
  parseEvents,
  parseLineups,
  parseMatches,
  parseThreeSixty,
} from "./parse.js";

export {
  STATSBOMB_OPEN_DATA_BASE_URL,
  fetchCompetitions,
  fetchLineups,
  fetchMatchEvents,
  fetchMatchThreeSixty,
  fetchMatches,
  loadCompetitions,
  loadEvents,
  loadLineups,
  loadMatches,
  loadThreeSixty,
  matchEventsUrl,
  matchThreeSixtyUrl,
} from "./load.js";
export type { StatsBombLoadOptions } from "./load.js";

export {
  actorIn,
  carries,
  indexThreeSixtyByEvent,
  isCarry,
  isPass,
  isShot,
  keeperIn,
  ofType,
  opponentsIn,
  passes,
  shots,
  teammatesIn,
  visibleAreaPolygon,
} from "./select.js";

export {
  isActor,
  isAssist,
  isComplete,
  isCorner,
  isCross,
  isFreeKick,
  isGoal,
  isKeeper,
  isKeyPass,
  isOnTarget,
  isOpponent,
  isPenalty,
  isSetPiece,
  isSwitch,
  isTeammate,
  isThroughBall,
  isThrowIn,
} from "./predicates.js";

// Re-exported so a consumer importing only this subpath can still catch and
// branch on failures without a second import from the package root.
export { DataProviderError } from "../errors.js";
export type { DataProviderErrorKind } from "../errors.js";
export type { LoadOptions } from "../fetch-json.js";
