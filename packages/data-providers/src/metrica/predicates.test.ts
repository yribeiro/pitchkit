import { describe, expect, it } from "vitest";
import { eventsFixture, game2EventsFixture } from "./fixtures.js";
import { parseEvents } from "./parse.js";
import {
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
import { shots } from "./select.js";
import type { MetricaEvent } from "./types.js";

const events = parseEvents(eventsFixture());
const game2 = parseEvents(game2EventsFixture());

function find(predicate: (event: MetricaEvent) => boolean): MetricaEvent {
  const event = events.find(predicate);
  if (!event) throw new Error("fixture is missing a case");
  return event;
}

describe("subtypes", () => {
  it("split on hyphens only, keeping qualifiers that contain a space", () => {
    expect(subtypesOf(find((e) => e.Subtype === "HEAD-ON TARGET-GOAL"))).toEqual([
      "HEAD",
      "ON TARGET",
      "GOAL",
    ]);
    expect(subtypesOf(find((e) => e.Subtype === null))).toEqual([]);
  });

  it("match whole qualifiers, so GOAL is not GOAL KICK", () => {
    const goalKick = find((e) => e.Subtype === "GOAL KICK");
    expect(hasSubtype(goalKick, "GOAL")).toBe(false);
    expect(hasSubtype(goalKick, "GOAL KICK")).toBe(true);
  });
});

describe("goals", () => {
  it("counts the shots that scored", () => {
    expect(shots(events).filter(isGoal)).toHaveLength(2);
  });

  it("keeps an own goal apart from them, credited to the side that conceded", () => {
    const ownGoal = find(isOwnGoal);
    expect(ownGoal).toMatchObject({ Team: "Home", Type: "BALL OUT", Subtype: "WOODWORK-GOAL" });
    expect(isGoal(ownGoal)).toBe(false);
    expect(isWoodwork(ownGoal)).toBe(true);
  });

  it("reads shot results", () => {
    expect(isOnTarget(find((e) => e.Subtype === "ON TARGET-SAVED"))).toBe(true);
    expect(isSaved(find((e) => e.Subtype === "ON TARGET-SAVED"))).toBe(true);
    expect(isBlocked(find((e) => e.Type === "SHOT" && e.Subtype === "BLOCKED"))).toBe(true);
    expect(isOnTarget(find((e) => e.Subtype === "OFF TARGET-OUT"))).toBe(false);
  });

  it("doesn't read a keeper's save as a saved shot", () => {
    const keeper = find((e) => e.Type === "RECOVERY" && e.Subtype === "SAVED");
    expect(isSaved(keeper)).toBe(false);
  });

  it("reads headers", () => {
    expect(isHeader(find((e) => e.Subtype === "HEAD-ON TARGET-GOAL"))).toBe(true);
  });
});

describe("passing, challenges and cards", () => {
  it("reads pass qualifiers", () => {
    expect(isCross(find((e) => e.Subtype === "CROSS"))).toBe(true);
    expect(isThroughBall(find((e) => e.Subtype === "THROUGH BALL-DEEP BALL"))).toBe(true);
    expect(isClearance(find((e) => e.Subtype === "CLEARANCE"))).toBe(true);
  });

  it("reads both sides of a foul", () => {
    const fouled = find((e) => e.Subtype === "TACKLE-FAULT-WON");
    const fouler = find((e) => e.Subtype === "TACKLE-FAULT-LOST");
    expect([isFault(fouled), wonChallenge(fouled), lostChallenge(fouled)]).toEqual([
      true,
      true,
      false,
    ]);
    expect([isFault(fouler), wonChallenge(fouler), lostChallenge(fouler)]).toEqual([
      true,
      false,
      true,
    ]);
  });

  it("reads cards", () => {
    const card = find((e) => e.Type === "CARD");
    expect(isYellowCard(card)).toBe(true);
    expect(isRedCard(card)).toBe(false);
  });
});

describe("set pieces", () => {
  it("reads each kind", () => {
    expect(isKickOff(events[0] as MetricaEvent)).toBe(true);
    expect(isCornerKick(find((e) => e.Subtype === "CORNER KICK"))).toBe(true);
    expect(isFreeKick(find((e) => e.Subtype === "FREE KICK"))).toBe(true);
    expect(isThrowIn(find((e) => e.Subtype === "THROW IN"))).toBe(true);
    expect(game2.filter(isPenalty)).toHaveLength(1);
  });

  it("finds a goal kick on the kick itself, not on a set piece", () => {
    const goalKick = find(isGoalKick);
    expect(goalKick.Type).toBe("PASS");
  });
});

describe("locations", () => {
  it("narrow to events with positions", () => {
    expect(hasLocation(events[0] as MetricaEvent)).toBe(false);
    expect(hasLocation(events[1] as MetricaEvent)).toBe(true);
    expect(hasEndLocation(find((e) => e.Type === "RECOVERY"))).toBe(false);
    const located = events.filter(hasEndLocation);
    expect(located.every((e) => typeof e.endX === "number")).toBe(true);
  });
});
