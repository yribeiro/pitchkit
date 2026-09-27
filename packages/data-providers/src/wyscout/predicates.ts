import type { WyscoutEvent } from "./types.js";

/**
 * Wyscout's interpretation layer.
 *
 * Almost nothing in a Wyscout event is a field. Whether a pass found its
 * target, whether a shot was a goal, which foot took it, whether a duel was
 * won — all of it is a numeric tag on `event.tags`. That makes the raw data
 * compact and completely opaque: `[{ id: 1801 }]` means "accurate", and there
 * is no way to know that from the event.
 *
 * So these are the reading layer. `hasTag` is the primitive, `WYSCOUT_TAGS`
 * is the vocabulary, and the named predicates below compose with `.filter()`.
 */

/**
 * The full tag vocabulary, from figshare's `tags2name.csv`.
 *
 * Named by what the tag means rather than by Wyscout's own label column,
 * which mixes cases and spellings (`Goal`, `own_goal`, `not accurate`).
 */
export const WYSCOUT_TAGS = {
  GOAL: 101,
  OWN_GOAL: 102,
  ASSIST: 301,
  KEY_PASS: 302,
  COUNTER_ATTACK: 1901,
  LEFT_FOOT: 401,
  RIGHT_FOOT: 402,
  HEAD_OR_BODY: 403,
  DIRECT: 1101,
  INDIRECT: 1102,
  DANGEROUS_BALL_LOST: 2001,
  BLOCKED: 2101,
  HIGH: 801,
  LOW: 802,
  INTERCEPTION: 1401,
  CLEARANCE: 1501,
  OPPORTUNITY: 201,
  FEINT: 1301,
  MISSED_BALL: 1302,
  FREE_SPACE_RIGHT: 501,
  FREE_SPACE_LEFT: 502,
  TAKE_ON_LEFT: 503,
  TAKE_ON_RIGHT: 504,
  SLIDING_TACKLE: 1601,
  ANTICIPATED: 601,
  ANTICIPATION: 602,
  RED_CARD: 1701,
  YELLOW_CARD: 1702,
  SECOND_YELLOW_CARD: 1703,
  THROUGH: 901,
  FAIRPLAY: 1001,
  LOST: 701,
  NEUTRAL: 702,
  WON: 703,
  ACCURATE: 1801,
  NOT_ACCURATE: 1802,
} as const;

/**
 * Where a shot ended up, as Wyscout records it: 1201-1223, covering the nine
 * zones of the goal, the posts, and off-target.
 *
 * This is the reason a shot has no end coordinate — the information is here
 * instead, and `positions[1]` is a placeholder.
 */
export const WYSCOUT_GOAL_ZONE_TAGS: Readonly<Record<number, string>> = {
  1201: "goal low center",
  1202: "goal low right",
  1203: "goal center",
  1204: "goal center left",
  1205: "goal low left",
  1206: "goal center right",
  1207: "goal high center",
  1208: "goal high left",
  1209: "goal high right",
  1210: "out low right",
  1211: "out center left",
  1212: "out low left",
  1213: "out center right",
  1214: "out high center",
  1215: "out high left",
  1216: "out high right",
  1217: "post low right",
  1218: "post center left",
  1219: "post low left",
  1220: "post center right",
  1221: "post high center",
  1222: "post high left",
  1223: "post high right",
};

/** Does this event carry the given tag id? The primitive everything else uses. */
export function hasTag(event: WyscoutEvent, tagId: number): boolean {
  return event.tags.some((tag) => tag.id === tagId);
}

/**
 * Where a shot went, as a readable string — `"goal low left"`,
 * `"out high right"` — or `undefined` if the event carries no zone tag.
 */
export function shotGoalZone(event: WyscoutEvent): string | undefined {
  for (const tag of event.tags) {
    const zone = WYSCOUT_GOAL_ZONE_TAGS[tag.id];
    if (zone !== undefined) return zone;
  }
  return undefined;
}

/**
 * Does this event have a real end location?
 *
 * False for `Shot`, `Interruption` and `Offside`, where Wyscout writes a
 * placeholder rather than a position — which is why `endX`/`endY` are absent
 * on those events rather than wrong.
 */
export function hasEndLocation(event: WyscoutEvent): boolean {
  return event.endX !== undefined && event.endY !== undefined;
}

/**
 * Was this a goal?
 *
 * Applies to the event that produced it — but note the same tag also sits on
 * the conceding keeper's `Save attempt`, so filter `shots()` rather than the
 * whole feed unless you want both sides of each goal. See `shots`.
 */
export const isGoal = (event: WyscoutEvent): boolean => hasTag(event, WYSCOUT_TAGS.GOAL);
export const isOwnGoal = (event: WyscoutEvent): boolean => hasTag(event, WYSCOUT_TAGS.OWN_GOAL);

/**
 * Did the action find its target?
 *
 * Wyscout's equivalent of a completed pass, and it is an explicit tag on both
 * sides: every pass carries either 1801 or 1802. Unlike StatsBomb, where a
 * completed pass is the *absence* of an outcome, there is nothing to infer.
 */
export const isAccurate = (event: WyscoutEvent): boolean => hasTag(event, WYSCOUT_TAGS.ACCURATE);
export const isNotAccurate = (event: WyscoutEvent): boolean =>
  hasTag(event, WYSCOUT_TAGS.NOT_ACCURATE);

export const isAssist = (event: WyscoutEvent): boolean => hasTag(event, WYSCOUT_TAGS.ASSIST);
export const isKeyPass = (event: WyscoutEvent): boolean => hasTag(event, WYSCOUT_TAGS.KEY_PASS);
export const isThrough = (event: WyscoutEvent): boolean => hasTag(event, WYSCOUT_TAGS.THROUGH);
export const isCounterAttack = (event: WyscoutEvent): boolean =>
  hasTag(event, WYSCOUT_TAGS.COUNTER_ATTACK);
export const isOpportunity = (event: WyscoutEvent): boolean =>
  hasTag(event, WYSCOUT_TAGS.OPPORTUNITY);
export const isBlocked = (event: WyscoutEvent): boolean => hasTag(event, WYSCOUT_TAGS.BLOCKED);
export const isInterception = (event: WyscoutEvent): boolean =>
  hasTag(event, WYSCOUT_TAGS.INTERCEPTION);
export const isClearance = (event: WyscoutEvent): boolean =>
  hasTag(event, WYSCOUT_TAGS.CLEARANCE);
export const isSlidingTackle = (event: WyscoutEvent): boolean =>
  hasTag(event, WYSCOUT_TAGS.SLIDING_TACKLE);
export const isDangerousBallLost = (event: WyscoutEvent): boolean =>
  hasTag(event, WYSCOUT_TAGS.DANGEROUS_BALL_LOST);

/** Duel outcomes — a duel carries exactly one of these three. */
export const wonDuel = (event: WyscoutEvent): boolean => hasTag(event, WYSCOUT_TAGS.WON);
export const lostDuel = (event: WyscoutEvent): boolean => hasTag(event, WYSCOUT_TAGS.LOST);
export const neutralDuel = (event: WyscoutEvent): boolean => hasTag(event, WYSCOUT_TAGS.NEUTRAL);

/** Body part. A shot or pass carries at most one. */
export const isLeftFoot = (event: WyscoutEvent): boolean => hasTag(event, WYSCOUT_TAGS.LEFT_FOOT);
export const isRightFoot = (event: WyscoutEvent): boolean =>
  hasTag(event, WYSCOUT_TAGS.RIGHT_FOOT);
export const isHeadOrBody = (event: WyscoutEvent): boolean =>
  hasTag(event, WYSCOUT_TAGS.HEAD_OR_BODY);

/** Cards, which ride on the `Foul` they were shown for. */
export const isYellowCard = (event: WyscoutEvent): boolean =>
  hasTag(event, WYSCOUT_TAGS.YELLOW_CARD);
export const isSecondYellowCard = (event: WyscoutEvent): boolean =>
  hasTag(event, WYSCOUT_TAGS.SECOND_YELLOW_CARD);
export const isRedCard = (event: WyscoutEvent): boolean => hasTag(event, WYSCOUT_TAGS.RED_CARD);

/** Any dismissal — a straight red, or a second yellow. */
export const isSendingOff = (event: WyscoutEvent): boolean =>
  isRedCard(event) || isSecondYellowCard(event);
