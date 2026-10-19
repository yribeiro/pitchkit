/**
 * Impect open-data loader: event data for all 306 Bundesliga 2023/24
 * matches, with lineups, squads and players.
 *
 * ```ts
 * import { fetchMatchEvents, isGoal, shots } from "@pitchkit/data-providers/impect";
 *
 * const events = await fetchMatchEvents(122838); // Werder Bremen 0-4 Bayern
 * const goals = shots(events).filter(isGoal);
 * ```
 *
 * The same four layers as the other providers: `parse*` (pure), `load*` /
 * `fetch*` (network), narrowing selectors, and composable predicates. Three
 * things to know before you plot anything:
 *
 * 1. **Two coordinate frames.** `start.coordinates` are absolute, and teams
 *    swap ends at half time. `start.adjCoordinates` turn every event so the
 *    acting team attacks towards `+x`; those are the ones lifted to
 *    `x`/`y`/`endX`/`endY`. Plot either with `<Pitch type="impect">`:
 *    metres from the centre spot, y increasing to the left.
 * 2. **The second half's clock starts at 10,000 seconds.** Use
 *    `matchSeconds` for a match clock and `inMatchOrder` to sort.
 * 3. **Set pieces aren't `PASS` events, and own goals aren't shots.** A
 *    corner or throw-in is its own action type with a `pass` object, so use
 *    `hasPass` for every ball played. An own goal is an `OWN_GOAL` event
 *    credited to the team that conceded; `score` counts it.
 *
 * **Impect's data is not openly licensed.** Their terms allow non-commercial
 * analytical and research use, forbid redistributing or altering the data,
 * and ask for Impect to be credited, with their logo, in anything published.
 * This package ships none of it and fetches from Impect's own repository.
 *
 * @see https://github.com/ImpectAPI/open-data
 * @module impect
 */

export type {
  ImpectActionType,
  ImpectEvent,
  ImpectGameTime,
  ImpectIdMappings,
  ImpectIteration,
  ImpectLineups,
  ImpectLineupSquad,
  ImpectLocation,
  ImpectMatchSummary,
  ImpectPlayer,
  ImpectPoint,
  ImpectSquad,
  Known,
} from "./types.js";

export {
  parseEvents,
  parseIterations,
  parseLineups,
  parseMatches,
  parsePlayers,
  parseSquads,
} from "./parse.js";

export {
  eventsUrl,
  fetchIterations,
  fetchLineups,
  fetchMatches,
  fetchMatchEvents,
  fetchPlayers,
  fetchSquads,
  IMPECT_BUNDESLIGA_2023_24,
  IMPECT_OPEN_DATA_BASE_URL,
  iterationsUrl,
  lineupsUrl,
  loadIterations,
  loadLineups,
  loadMatches,
  loadMatchEvents,
  loadPlayers,
  loadSquads,
  matchesUrl,
  playersUrl,
  squadsUrl,
} from "./load.js";
export type { ImpectLoadOptions } from "./load.js";

export {
  byPlayer,
  byTeam,
  indexPlayersById,
  indexSquadsById,
  inMatchOrder,
  inPeriod,
  matchSeconds,
  ofType,
  passes,
  score,
  shots,
} from "./select.js";

export {
  hasEndLocation,
  hasLocation,
  hasPass,
  hasTargetPoint,
  isCorner,
  isDirectFreeKick,
  isFailed,
  isFreeKick,
  isGoal,
  isHeader,
  isOwnGoal,
  isPenalty,
  isSetPiece,
  isSuccessful,
  isThrowIn,
} from "./predicates.js";

// Re-exported so a consumer importing only this subpath can still catch and
// branch on failures without a second import from the package root.
export { DataProviderError } from "../errors.js";
export type { DataProviderErrorKind } from "../errors.js";
export type { LoadOptions } from "../fetch-json.js";
