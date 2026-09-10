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
} from "./types.js";

export { parseCompetitions, parseEvents, parseLineups, parseMatches } from "./parse.js";

export {
  STATSBOMB_OPEN_DATA_BASE_URL,
  fetchCompetitions,
  fetchLineups,
  fetchMatchEvents,
  fetchMatches,
  loadCompetitions,
  loadEvents,
  loadLineups,
  loadMatches,
  matchEventsUrl,
} from "./load.js";
export type { StatsBombLoadOptions } from "./load.js";

export { carries, isCarry, isPass, isShot, ofType, passes, shots } from "./select.js";

export {
  isAssist,
  isComplete,
  isCorner,
  isCross,
  isFreeKick,
  isGoal,
  isKeyPass,
  isOnTarget,
  isPenalty,
  isSetPiece,
  isSwitch,
  isThroughBall,
  isThrowIn,
} from "./predicates.js";

// Re-exported so a consumer importing only this subpath can still catch and
// branch on failures without a second import from the package root.
export { DataProviderError } from "../errors.js";
export type { DataProviderErrorKind } from "../errors.js";
export type { LoadOptions } from "../fetch-json.js";
