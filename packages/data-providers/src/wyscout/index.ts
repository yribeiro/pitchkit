/**
 * Wyscout open-data loader.
 *
 * The Pappalardo et al. dataset: 1,941 matches of event data across the
 * 2017/18 Spanish, Italian, English, German and French first divisions, plus
 * the 2018 World Cup and Euro 2016. Released under CC BY 4.0.
 *
 * Four layers, each usable on its own: `parse*` (pure, no network),
 * `load*`/`fetch*` (network), `shots`/`passes`/`duels` (narrowing selectors)
 * and the `is*` predicates (composable filters).
 *
 * ```ts
 * import { fetchMatch, shots, isGoal } from "@pitchkit/data-providers/wyscout";
 *
 * const match = await fetchMatch(2499841); // Huddersfield v Man City
 * const goals = shots(match.events).filter(isGoal);
 * ```
 *
 * Three things about this data are load-bearing and easy to get wrong:
 *
 * 1. **Coordinates are normalised to the attacking direction.** `x: 100` is
 *    always the goal that event's team is attacking, in both halves — so both
 *    teams appear to attack left-to-right and nothing flips at half time.
 * 2. **A shot has no end coordinate.** Where it went is in its goal-mouth tag
 *    (`shotGoalZone`), not in `positions[1]`, which is a placeholder. Hence
 *    `endX`/`endY` are absent on shots rather than wrong.
 * 3. **Everything else is a tag too.** Accuracy, assists, cards, body part —
 *    all numeric ids on `event.tags`. `hasTag` and the named predicates are
 *    how you read them.
 *
 * Plot it with `<Pitch type="wyscout">`, whose grid is this one: 0-100 on both
 * axes, origin top-left, y downward. Note that is **not** Opta's grid, which
 * is y-up from the bottom-left.
 *
 * @module wyscout
 */

export type {
  Known,
  WyscoutArea,
  WyscoutCompetition,
  WyscoutEvent,
  WyscoutEventName,
  WyscoutMatch,
  WyscoutMatchPeriod,
  WyscoutMatchPlayer,
  WyscoutPlayer,
  WyscoutPlayerRole,
  WyscoutPosition,
  WyscoutTag,
  WyscoutTeam,
} from "./types.js";

export {
  parseCompetitions,
  parseEvents,
  parseMatch,
  parseMatchPlayers,
  parseTeams,
} from "./parse.js";

export {
  fetchCompetitions,
  fetchMatch,
  fetchMatchEvents,
  fetchTeams,
  loadCompetitions,
  loadMatch,
  loadMatchEvents,
  loadTeams,
  matchUrl,
  referenceUrl,
  WYSCOUT_EVENTS_BASE_URL,
  WYSCOUT_REFERENCE_BASE_URL,
  WYSCOUT_REFERENCE_FILE_IDS,
} from "./load.js";
export type { WyscoutLoadOptions, WyscoutReferenceFile } from "./load.js";

export {
  byPlayer,
  byTeam,
  duels,
  fouls,
  freeKicks,
  inMatchOrder,
  indexPlayersById,
  matchSeconds,
  ofType,
  passes,
  shots,
  squadOf,
  teamIds,
} from "./select.js";

export {
  hasEndLocation,
  hasTag,
  isAccurate,
  isAssist,
  isBlocked,
  isClearance,
  isCounterAttack,
  isDangerousBallLost,
  isGoal,
  isHeadOrBody,
  isInterception,
  isKeyPass,
  isLeftFoot,
  isNotAccurate,
  isOpportunity,
  isOwnGoal,
  isRedCard,
  isRightFoot,
  isSecondYellowCard,
  isSendingOff,
  isSlidingTackle,
  isThrough,
  isYellowCard,
  lostDuel,
  neutralDuel,
  shotGoalZone,
  wonDuel,
  WYSCOUT_GOAL_ZONE_TAGS,
  WYSCOUT_TAGS,
} from "./predicates.js";

// Re-exported so a consumer importing only this subpath can still catch and
// branch on failures without a second import from the package root.
export { DataProviderError } from "../errors.js";
export type { DataProviderErrorKind } from "../errors.js";
export type { LoadOptions } from "../fetch-json.js";
