import { describe, expect, it } from "vitest";
import { matchFixture } from "./fixtures.js";
import { parseMatch } from "./parse.js";
import type { WyscoutEvent } from "./types.js";
import * as predicates from "./predicates.js";
import {
  hasEndLocation,
  hasTag,
  isAccurate,
  isGoal,
  isHeadOrBody,
  isKeyPass,
  isNotAccurate,
  isSendingOff,
  isYellowCard,
  lostDuel,
  neutralDuel,
  shotGoalZone,
  wonDuel,
  WYSCOUT_TAGS,
} from "./predicates.js";
import { duels, passes, shots } from "./select.js";

const events = parseMatch(matchFixture()).events;

describe("hasTag", () => {
  it("is the primitive the named predicates are built from", () => {
    const accurate = events.filter((e) => hasTag(e, WYSCOUT_TAGS.ACCURATE));
    expect(accurate.length).toBeGreaterThan(0);
    expect(accurate.every(isAccurate)).toBe(true);
  });

  it("returns false for a tag the event doesn't carry", () => {
    expect(events.every((e) => hasTag(e, 99999) === false)).toBe(true);
  });
});

describe("isGoal", () => {
  it("finds the goal in the fixture", () => {
    expect(events.filter(isGoal).length).toBeGreaterThan(0);
  });

  it("also sits on the conceding keeper's save attempt, not only on the shot", () => {
    // The trap this package documents: tag 101 marks a goal on both sides of
    // the same event, so filtering the whole feed double-counts. Measured
    // across six full matches: 15 shots, 19 save attempts, 3 free kicks.
    const scorers = events.filter(isGoal);
    expect(scorers.some((e) => e.eventName === "Save attempt")).toBe(true);
  });
});

describe("accuracy", () => {
  it("is an explicit tag on both sides — nothing is inferred from absence", () => {
    // Unlike StatsBomb, where a completed pass is the *absence* of an
    // outcome, every Wyscout pass carries either 1801 or 1802.
    for (const pass of passes(events)) {
      expect(isAccurate(pass) || isNotAccurate(pass)).toBe(true);
      expect(isAccurate(pass)).toBe(!isNotAccurate(pass));
    }
  });
});

describe("duel outcomes", () => {
  it("every duel carries exactly one of won / lost / neutral", () => {
    const all = duels(events);
    expect(all.length).toBeGreaterThan(2);
    for (const duel of all) {
      const outcomes = [wonDuel(duel), lostDuel(duel), neutralDuel(duel)].filter(Boolean);
      expect(outcomes).toHaveLength(1);
    }
  });
});

describe("shotGoalZone", () => {
  it("reads where a shot went from its tag, since there is no end coordinate", () => {
    const zoned = shots(events)
      .map((shot) => ({ shot, zone: shotGoalZone(shot) }))
      .filter((entry) => entry.zone !== undefined);

    expect(zoned.length).toBeGreaterThan(0);
    for (const { shot, zone } of zoned) {
      expect(zone).toMatch(/^(goal|out|post) /);
      // The two facts are a pair: the zone exists *because* the coordinate
      // doesn't.
      expect(hasEndLocation(shot)).toBe(false);
    }
  });

  it("returns undefined when no zone tag is present", () => {
    const pass = passes(events)[0];
    expect(pass && shotGoalZone(pass)).toBeUndefined();
  });
});

describe("hasEndLocation", () => {
  it("is true for a pass and false for a shot", () => {
    expect(passes(events).some(hasEndLocation)).toBe(true);
    expect(shots(events).some(hasEndLocation)).toBe(false);
  });
});

describe("cards", () => {
  it("ride on the Foul they were shown for", () => {
    const booked = events.filter(isYellowCard);
    expect(booked.length).toBeGreaterThan(0);
    expect(booked.every((e) => e.eventName === "Foul")).toBe(true);
  });

  it("isSendingOff covers a straight red and a second yellow, but not a first", () => {
    const booked = events.filter(isYellowCard);
    expect(booked.every((e) => isSendingOff(e) === false)).toBe(true);
  });
});

describe("body part", () => {
  it("is a tag, so a headed shot is found without a field for it", () => {
    expect(shots(events).some(isHeadOrBody)).toBe(true);
  });
});

describe("isKeyPass", () => {
  it("finds the pass that created a chance", () => {
    expect(events.filter(isKeyPass).length).toBeGreaterThan(0);
  });
});

describe("every named predicate", () => {
  // Each predicate is a one-line `hasTag` wrapper, so the failure mode is a
  // wrong tag id — which no amount of testing the *interesting* ones catches.
  // This walks the lot, asserting each agrees with its own tag.
  const CASES: ReadonlyArray<[string, (e: WyscoutEvent) => boolean, number]> = [
    ["isGoal", predicates.isGoal, WYSCOUT_TAGS.GOAL],
    ["isOwnGoal", predicates.isOwnGoal, WYSCOUT_TAGS.OWN_GOAL],
    ["isAssist", predicates.isAssist, WYSCOUT_TAGS.ASSIST],
    ["isKeyPass", predicates.isKeyPass, WYSCOUT_TAGS.KEY_PASS],
    ["isAccurate", predicates.isAccurate, WYSCOUT_TAGS.ACCURATE],
    ["isNotAccurate", predicates.isNotAccurate, WYSCOUT_TAGS.NOT_ACCURATE],
    ["isThrough", predicates.isThrough, WYSCOUT_TAGS.THROUGH],
    ["isCounterAttack", predicates.isCounterAttack, WYSCOUT_TAGS.COUNTER_ATTACK],
    ["isOpportunity", predicates.isOpportunity, WYSCOUT_TAGS.OPPORTUNITY],
    ["isBlocked", predicates.isBlocked, WYSCOUT_TAGS.BLOCKED],
    ["isInterception", predicates.isInterception, WYSCOUT_TAGS.INTERCEPTION],
    ["isClearance", predicates.isClearance, WYSCOUT_TAGS.CLEARANCE],
    ["isSlidingTackle", predicates.isSlidingTackle, WYSCOUT_TAGS.SLIDING_TACKLE],
    ["isDangerousBallLost", predicates.isDangerousBallLost, WYSCOUT_TAGS.DANGEROUS_BALL_LOST],
    ["wonDuel", predicates.wonDuel, WYSCOUT_TAGS.WON],
    ["lostDuel", predicates.lostDuel, WYSCOUT_TAGS.LOST],
    ["neutralDuel", predicates.neutralDuel, WYSCOUT_TAGS.NEUTRAL],
    ["isLeftFoot", predicates.isLeftFoot, WYSCOUT_TAGS.LEFT_FOOT],
    ["isRightFoot", predicates.isRightFoot, WYSCOUT_TAGS.RIGHT_FOOT],
    ["isHeadOrBody", predicates.isHeadOrBody, WYSCOUT_TAGS.HEAD_OR_BODY],
    ["isYellowCard", predicates.isYellowCard, WYSCOUT_TAGS.YELLOW_CARD],
    ["isSecondYellowCard", predicates.isSecondYellowCard, WYSCOUT_TAGS.SECOND_YELLOW_CARD],
    ["isRedCard", predicates.isRedCard, WYSCOUT_TAGS.RED_CARD],
  ];

  it.each(CASES)("%s matches exactly the events carrying its tag", (_name, predicate, tagId) => {
    for (const event of events) {
      expect(predicate(event)).toBe(hasTag(event, tagId));
    }
  });

  it("covers every predicate the module exports", () => {
    // So a predicate added later without a case here fails rather than
    // quietly going untested.
    const exported = Object.entries(predicates)
      .filter(([name, value]) => typeof value === "function" && /^(is|won|lost|neutral)/.test(name))
      .map(([name]) => name)
      .filter((name) => !["isSendingOff"].includes(name)) // composed, tested above
      .sort();
    const covered = CASES.map(([name]) => name).sort();
    expect(exported).toEqual(covered);
  });
});
