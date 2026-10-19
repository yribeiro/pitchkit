import { describe, expect, it } from "vitest";
import { eventsFixture } from "./fixtures.js";
import { parseEvents } from "./parse.js";
import {
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
import { shots } from "./select.js";

const events = parseEvents(eventsFixture());

describe("goals", () => {
  it("are the scoring shots, not the GOAL markers", () => {
    const goals = events.filter(isGoal);
    expect(goals.map((event) => event.actionType)).toEqual(["SHOT", "SHOT"]);
    expect(goals.every(hasLocation)).toBe(true);
  });

  it("keep own goals apart, credited to the side that conceded", () => {
    const [ownGoal] = events.filter(isOwnGoal);
    expect(ownGoal?.squadId).toBe(1);
    expect(isGoal(ownGoal!)).toBe(false);
    expect(hasLocation(ownGoal!)).toBe(false);
  });

  it("tell penalties, headers and direct free kicks apart", () => {
    const [, header, penalty] = shots(events);
    expect([isPenalty(penalty!), isHeader(header!), isDirectFreeKick(penalty!)]).toEqual([
      true,
      true,
      false,
    ]);
    expect(isDirectFreeKick({ ...penalty!, action: "DIRECT_FREE_KICK" })).toBe(true);
  });

  it("find the shots with a goal-mouth target point", () => {
    expect(shots(events).filter(hasTargetPoint)).toHaveLength(1);
    expect(events.filter(hasTargetPoint)[0]?.shot.targetPoint).toEqual({ y: 2, z: 0.5 });
  });
});

describe("results and passes", () => {
  it("read result", () => {
    expect(events.filter(isSuccessful).map((event) => event.index)).toEqual([0, 2, 5, 11, 13, 15]);
    expect(events.filter(isFailed).map((event) => event.actionType)).toEqual(["SHOT", "CORNER"]);
  });

  it("count set pieces as passes played, though not as PASS events", () => {
    expect(events.filter(hasPass).map((event) => event.actionType)).toEqual([
      "KICK_OFF",
      "PASS",
      "PASS",
      "CORNER",
      "KICK_OFF",
      "THROW_IN",
    ]);
    expect(events.filter(isSetPiece)).toHaveLength(4);
    expect([events.some(isCorner), events.some(isThrowIn), events.some(isFreeKick)]).toEqual([
      true,
      true,
      false,
    ]);
  });

  it("narrow to events with positions", () => {
    // The reception has a start but no end, so the two guards differ.
    expect(events.filter(hasEndLocation)).toHaveLength(10);
    expect(events.filter(hasLocation).length - events.filter(hasEndLocation).length).toBe(1);
    expect(events.filter((event) => !hasLocation(event)).map((event) => event.actionType)).toEqual([
      "GOAL",
      "FOUL",
      "FINAL_WHISTLE",
      "OWN_GOAL",
      "GOAL",
      "NO_VIDEO",
    ]);
  });
});
