import { describe, expect, it } from "vitest";
import {
  awayKickOffFixture,
  awayTrackingFixture,
  eventsFixture,
  homeKickOffFixture,
  homeTrackingFixture,
} from "./fixtures.js";
import { parseEvents, parseTracking } from "./parse.js";
import {
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
import type { MetricaFrame } from "./types.js";

const events = parseEvents(eventsFixture());
const frames = parseTracking(homeTrackingFixture(), awayTrackingFixture());

describe("event selectors", () => {
  it("narrow by type", () => {
    expect(shots(events).every((event) => event.Type === "SHOT")).toBe(true);
    expect(shots(events)).toHaveLength(6);
    expect(passes(events).every((event) => event.To !== null)).toBe(true);
    expect(challenges(events).length).toBeGreaterThan(0);
    expect(setPieces(events).every((event) => event.Type === "SET PIECE")).toBe(true);
    expect(ofType(events, "CARD")).toHaveLength(1);
  });

  it("narrow by side, player and half", () => {
    expect(byTeam(events, "Home").every((event) => event.Team === "Home")).toBe(true);
    expect(byPlayer(events, "Player9").every((event) => event.From === "Player9")).toBe(true);
    expect(inPeriod(events, 2).every((event) => event.Period === 2)).toBe(true);
    expect(inPeriod(events, 2).length).toBeGreaterThan(0);
  });

  it("inPeriod works on frames too", () => {
    expect(inPeriod(frames, 1)).toHaveLength(151);
    expect(inPeriod(frames, 2)).toHaveLength(0);
  });
});

describe("frame selectors", () => {
  const frame = frames[0] as MetricaFrame;

  it("split a frame by side", () => {
    expect(playersOfTeam(frame, "Home")).toHaveLength(11);
    expect(playersOfTeam(frame, "Away")).toHaveLength(11);
  });

  it("find a player by the spelling events use", () => {
    // The opening goal, placed on its own start frame.
    const goal = shots(events).find((event) => event["Start Frame"] === 2289);
    const atGoal = frames.find((f) => f.Frame === goal?.["Start Frame"]) as MetricaFrame;
    expect(findPlayer(atGoal, goal?.From ?? null)).toMatchObject({ team: "Home", jersey: 9 });
    expect(findPlayer(frame, "Player12")).toBeUndefined(); // a substitute
    expect(findPlayer(frame, null)).toBeUndefined();
  });
});

describe("attackingDirection", () => {
  const kickOff = parseTracking(homeKickOffFixture(), awayKickOffFixture())[0] as MetricaFrame;

  it("reads which end each side defends at a kick-off", () => {
    // Sample Game 1, first half: Home attack towards x = 1, which is where
    // the opening goal goes in. Away the other way.
    expect(kickOff.Frame).toBe(1);
    expect(attackingDirection(kickOff, "Home")).toBe("left_to_right");
    expect(attackingDirection(kickOff, "Away")).toBe("right_to_left");
  });

  it("can be wrong mid-play, which is why it wants a kick-off frame", () => {
    // Frame 2250, 39 frames before Home score at x = 1: Home are camped in
    // the Away half, so their mean x says the opposite.
    expect(attackingDirection(frames[0] as MetricaFrame, "Home")).toBe("right_to_left");
  });

  it("is null for a side with no one on the pitch", () => {
    const empty = { ...(frames[0] as MetricaFrame), players: [] };
    expect(attackingDirection(empty, "Home")).toBeNull();
  });
});
