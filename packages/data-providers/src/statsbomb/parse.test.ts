import { describe, expect, it } from "vitest";
import { DataProviderError } from "../errors.js";
import { competitionsFixture, eventsFixture, lineupsFixture, matchesFixture } from "./fixtures.js";
import { parseCompetitions, parseEvents, parseLineups, parseMatches } from "./parse.js";
import { isCarry, isPass, isShot, ofType } from "./select.js";
import type { StatsBombGenericEvent } from "./types.js";

describe("parseEvents", () => {
  const events = parseEvents(eventsFixture());

  it("parses every event in the fixture", () => {
    expect(events).toHaveLength(29);
  });

  it("lifts location[] to x/y", () => {
    const shot = events.find(isShot);
    expect(shot).toBeDefined();
    expect(shot?.x).toBe(shot?.location?.[0]);
    expect(shot?.y).toBe(shot?.location?.[1]);
    expect(typeof shot?.x).toBe("number");
  });

  it("leaves x/y undefined for the event types that carry no location", () => {
    // Starting XI, Half Start and Substitution genuinely have no `location`.
    const noLocation = events.filter((event) => event.location === undefined);
    expect(noLocation.length).toBeGreaterThan(0);
    for (const event of noLocation) {
      expect(event.x).toBeUndefined();
      expect(event.y).toBeUndefined();
    }
  });

  it("lifts end_location[] to endX/endY for shots, passes and carries", () => {
    for (const event of events) {
      if (isShot(event)) {
        expect(event.endX).toBe(event.shot.end_location[0]);
        expect(event.endY).toBe(event.shot.end_location[1]);
      } else if (isPass(event)) {
        expect(event.endX).toBe(event.pass.end_location[0]);
        expect(event.endY).toBe(event.pass.end_location[1]);
      } else if (isCarry(event)) {
        expect(event.endX).toBe(event.carry.end_location[0]);
        expect(event.endY).toBe(event.carry.end_location[1]);
      }
    }
  });

  it("sets endZ only for shots that left the ground", () => {
    const shots = events.filter(isShot);
    const grounded = shots.filter((shot) => shot.shot.end_location.length === 2);
    const airborne = shots.filter((shot) => shot.shot.end_location.length === 3);

    // Both cases are represented in the fixture on purpose — this is the
    // reason endZ is optional rather than required.
    expect(grounded.length).toBeGreaterThan(0);
    expect(airborne.length).toBeGreaterThan(0);

    for (const shot of grounded) expect(shot.endZ).toBeUndefined();
    for (const shot of airborne) expect(shot.endZ).toBe(shot.shot.end_location[2]);
  });

  it("preserves the original location arrays alongside the lifted values", () => {
    const shot = events.find(isShot);
    expect(shot?.location).toBeInstanceOf(Array);
    expect(shot?.shot.end_location).toBeInstanceOf(Array);
  });

  it("preserves fields this package does not model", () => {
    // There is no `raw` escape hatch, so the spread *is* the guarantee that
    // nothing is silently dropped. Starting XI's `tactics` is untyped here.
    const startingXi = ofType(events, "Starting XI")[0];
    expect(startingXi).toBeDefined();
    expect(startingXi?.tactics).toBeDefined();

    const duel = ofType(events, "Duel")[0];
    expect(duel?.duel).toBeDefined();
  });

  it("keeps unmodelled events reachable rather than dropping them", () => {
    const typeNames = new Set(events.map((event) => event.type.name));
    expect(typeNames).toContain("Pressure");
    expect(typeNames).toContain("Goal Keeper");
  });

  it("does not lift end coordinates for unmodelled event types", () => {
    // Only shot/pass/carry get endX/endY, matching the three types that are
    // explicitly typed. Everything else keeps its own sub-object untouched.
    for (const event of events) {
      if (isShot(event) || isPass(event) || isCarry(event)) continue;
      expect((event as StatsBombGenericEvent).endX).toBeUndefined();
    }
  });

  it("rejects a JSON document that is not an array", () => {
    expect(() => parseEvents({ events: [] })).toThrowError(DataProviderError);
    expect(() => parseEvents({ events: [] })).toThrowError(
      /JSON array.*but got an object with keys: events/,
    );
  });

  it("rejects a different StatsBomb file with a message that names the mix-up", () => {
    // The most likely user error: pasting a matches URL into an events box.
    expect(() => parseEvents(matchesFixture())).toThrowError(
      /events\[0\] is not a StatsBomb event/,
    );
    expect(() => parseEvents(matchesFixture())).toThrowError(/matches, lineups or competitions/);
    // Naming the keys it actually found is what turns "but got object" into
    // a message that identifies the file you pasted by mistake.
    expect(() => parseEvents(matchesFixture())).toThrowError(/keys: match_id/);
  });

  it("reports the index of the offending event", () => {
    expect(() => parseEvents([{ id: "a", type: { id: 1, name: "Pass" } }, 42])).toThrowError(
      /events\[1\]/,
    );
  });
});

describe("parseCompetitions", () => {
  it("parses competition-and-season rows", () => {
    const competitions = parseCompetitions(competitionsFixture());
    expect(competitions).toHaveLength(3);
    expect(typeof competitions[0]?.competition_id).toBe("number");
    expect(typeof competitions[0]?.season_id).toBe("number");
  });

  it("rejects the wrong file", () => {
    expect(() => parseCompetitions(eventsFixture())).toThrowError(
      /competitions\[0\] is not a StatsBomb competition/,
    );
    expect(() => parseCompetitions("nope")).toThrowError(DataProviderError);
  });
});

describe("parseMatches", () => {
  it("parses matches", () => {
    const matches = parseMatches(matchesFixture());
    expect(matches).toHaveLength(3);
    expect(typeof matches[0]?.match_id).toBe("number");
    expect(typeof matches[0]?.home_team.home_team_name).toBe("string");
  });

  it("rejects the wrong file", () => {
    expect(() => parseMatches(competitionsFixture())).toThrowError(
      /matches\[0\] is not a StatsBomb match/,
    );
  });
});

describe("parseLineups", () => {
  it("parses one entry per team", () => {
    const lineups = parseLineups(lineupsFixture());
    expect(lineups).toHaveLength(2);
    expect(lineups[0]?.lineup.length).toBeGreaterThan(0);
    expect(typeof lineups[0]?.team_name).toBe("string");
  });

  it("rejects the wrong file", () => {
    expect(() => parseLineups(matchesFixture())).toThrowError(
      /lineups\[0\] is not a StatsBomb lineup/,
    );
  });
});
