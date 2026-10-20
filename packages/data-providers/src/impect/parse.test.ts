import { describe, expect, it } from "vitest";
import { DataProviderError } from "../errors.js";
import {
  eventsFixture,
  iterationsFixture,
  lineupsFixture,
  matchesFixture,
  playersFixture,
  squadsFixture,
} from "./fixtures.js";
import {
  parseEvents,
  parseIterations,
  parseLineups,
  parseMatches,
  parsePlayers,
  parseSquads,
} from "./parse.js";

describe("parseEvents", () => {
  const events = parseEvents(eventsFixture());

  it("keeps every event, with Impect's field names untouched", () => {
    expect(events).toHaveLength(17);
    expect(events[2]).toMatchObject({
      actionType: "PASS",
      action: "LOW_PASS",
      result: "SUCCESS",
      squadId: 1,
      periodId: 1,
      gameTime: { gameTimeInSec: 5 },
    });
    expect(events[2]?.start?.coordinates).toEqual({ x: -10, y: 5 });
  });

  it("lifts the adjusted coordinates, not the absolute ones", () => {
    // An away clearance in the first half: the away side attacks -x then, so
    // its adjusted coordinates are the absolute ones mirrored.
    const clearance = events[4];
    expect(clearance?.start?.coordinates).toEqual({ x: 40, y: 1 });
    expect(clearance).toMatchObject({ x: -40, y: -1, endX: -10, endY: -20 });
  });

  it("leaves the lifted fields absent when there is no position", () => {
    const goal = events.find((event) => event.actionType === "GOAL");
    expect(goal).not.toHaveProperty("x");
    expect(goal).not.toHaveProperty("endX");
    const reception = events.find((event) => event.actionType === "RECEPTION");
    expect(reception?.x).toBe(-10);
    expect(reception).not.toHaveProperty("endX");
  });

  it("ignores a location whose coordinates aren't numbers", () => {
    const [event] = parseEvents([
      { actionType: "PASS", start: { adjCoordinates: { x: null, y: 1 } }, end: "nowhere" },
    ]);
    expect(event).not.toHaveProperty("x");
    expect(event).not.toHaveProperty("endX");
  });

  it("names the file it expected when given the wrong one", () => {
    expect(() => parseEvents(matchesFixture())).toThrow(/events_\{matchId\}\.json/);
    expect(() => parseEvents({ events: [] })).toThrow(DataProviderError);
    expect(() => parseEvents([null])).toThrow(/an Impect event:.*null/);
  });
});

describe("reference files", () => {
  it("parse each file as Impect wrote it", () => {
    expect(parseIterations(iterationsFixture())[0]).toMatchObject({ id: 1, season: "00/01" });
    expect(parseMatches(matchesFixture())[0]).toMatchObject({ homeSquadId: 1, awaySquadId: 2 });
    expect(parseSquads(squadsFixture()).map((squad) => squad.name)).toEqual(["Home FC", "Away FC"]);
    expect(parsePlayers(playersFixture())).toHaveLength(9);
    expect(parseLineups(lineupsFixture()).squadHome.startingFormation).toBe("4-4-2");
  });

  it("reject the wrong file, saying which one was expected", () => {
    expect(() => parseMatches(squadsFixture())).toThrow(/matches\/matches_\{iterationId\}/);
    expect(() => parseSquads(playersFixture())).toThrow(/an Impect squad/);
    expect(() => parsePlayers(squadsFixture())).toThrow(/players\/players_/);
    expect(() => parseIterations("[]")).toThrow(
      /Expected an array of Impect iterations, but got string/,
    );
    expect(() => parseLineups(eventsFixture())).toThrow(/lineups\/lineups_\{matchId\}/);
    expect(() => parseLineups({})).toThrow(/an empty object/);
  });
});
