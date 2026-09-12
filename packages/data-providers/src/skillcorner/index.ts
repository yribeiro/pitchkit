/**
 * SkillCorner open-data loader — broadcast tracking, dynamic events and
 * phases of play from 20 A-League 2024/25 matches.
 *
 * ```ts
 * import { fetchMatch, fetchDynamicEvents, offBallRuns } from "@pitchkit/data-providers/skillcorner";
 *
 * const match = await fetchMatch(1874553);
 * const runs = offBallRuns(await fetchDynamicEvents(match));
 * ```
 *
 * Same four layers as the StatsBomb module — `parse*` (pure), `fetch*`
 * (network), narrowing selectors, composable predicates — with three
 * differences worth knowing before you plot anything:
 *
 * 1. **Coordinates are metres from the centre spot**, on a pitch whose real
 *    dimensions vary by match (104-106 m long in this dataset). Parsers add
 *    corner-origin `pitchX`/`pitchY` using that match's own dimensions, which
 *    is why the loaders take the match rather than just its id.
 * 2. **The two files disagree about direction.** Tracking positions are
 *    absolute and swap ends at half time; dynamic-event x is normalised so
 *    positive always points at the goal being attacked. See
 *    `attackingSideOf` for resolving the former.
 * 3. **Tracking is big** — about 90 MB a match — and is served from a
 *    different host because it's stored in Git LFS. Prefer `streamTracking`
 *    or `fetchTrackingWindow` over `fetchTracking`.
 *
 * Data is MIT-licensed; SkillCorner ask to be credited in anything published
 * from it.
 *
 * @see https://github.com/SkillCorner/opendata
 * @module skillcorner
 */

export type {
  Known,
  SkillCornerBall,
  SkillCornerEvent,
  SkillCornerEventBase,
  SkillCornerEventType,
  SkillCornerFrame,
  SkillCornerMatch,
  SkillCornerMatchPlayer,
  SkillCornerMatchSummary,
  SkillCornerOffBallRun,
  SkillCornerOnBallEngagement,
  SkillCornerOtherEvent,
  SkillCornerPassingOption,
  SkillCornerPeriod,
  SkillCornerPhase,
  SkillCornerPlayerPossession,
  SkillCornerPlayerRole,
  SkillCornerSide,
  SkillCornerTeamRef,
  SkillCornerTrackedPlayer,
} from "./types.js";

export { attackingSideOf, pitchProjection, projectOrNull } from "./coordinates.js";
export type { PitchProjection } from "./coordinates.js";

export {
  parseDynamicEvents,
  parseMatch,
  parseMatches,
  parsePhasesOfPlay,
  parseTracking,
  parseTrackingFrame,
} from "./parse.js";

export {
  SKILLCORNER_LFS_BASE_URL,
  SKILLCORNER_OPEN_DATA_BASE_URL,
  dynamicEventsUrl,
  fetchDynamicEvents,
  fetchMatch,
  fetchMatches,
  fetchPhasesOfPlay,
  fetchTracking,
  fetchTrackingWindow,
  matchUrl,
  matchesUrl,
  phasesOfPlayUrl,
  streamTracking,
  trackingUrl,
} from "./load.js";
export type { SkillCornerLoadOptions, TrackingWindowOptions } from "./load.js";

export {
  detectedPlayers,
  framesInPhase,
  inPlayFrames,
  indexPlayersById,
  isOffBallRun,
  isOnBallEngagement,
  isPassingOption,
  isPlayerPossession,
  ofEventType,
  offBallRuns,
  onBallEngagements,
  passingOptions,
  playerPossessions,
  playersOfTeam,
} from "./select.js";

export {
  breaksDefensiveLine,
  hasLocation,
  hasPath,
  inAttackingThird,
  inPenaltyArea,
  isCarry,
  isCompletePass,
  isDangerous,
  isDetected,
  isOneTouch,
  isPhaseType,
  isRunBehind,
  isRunSubtype,
  isSprint,
  leadToGoal,
  leadToShot,
  phaseLedToGoal,
  phaseLedToShot,
  wasReceived,
  wasTargeted,
} from "./predicates.js";

export { DataProviderError } from "../errors.js";
export type { DataProviderErrorKind } from "../errors.js";
export type { LoadOptions } from "../fetch-json.js";
