import { describe, expect, it } from "vitest";
import { DataProviderError } from "../errors.js";
import { competitionsFixture, matchFixture } from "./fixtures.js";
import { parseCompetitions, parseEvents, parseMatch, parseTeams } from "./parse.js";

const match = parseMatch(matchFixture());
const events = match.events;

describe("parseMatch", () => {
  it("reads the events, teams and squads out of one match file", () => {
    expect(events).toHaveLength(27);
    expect(new Set(Object.keys(match.teams))).toEqual(new Set(["1673", "1625"]));
    expect(match.teams["1673"]?.name).toBe("Huddersfield Town");
    expect(match.teams["1625"]?.name).toBe("Manchester City");
  });

  it("leaves Wyscout's own field names and values untouched", () => {
    const first = events[0];
    expect(first?.eventName).toBe("Pass");
    expect(first?.subEventName).toBe("Simple pass");
    expect(first?.matchPeriod).toBe("1H");
    // The raw positions array survives alongside the lifted coordinates.
    expect(first?.positions).toEqual([
      { x: 50, y: 50 },
      { x: 39, y: 71 },
    ]);
  });

  it("rejects a file that is not a match file, naming the likely mix-up", () => {
    const error = (() => {
      try {
        parseMatch(competitionsFixture());
      } catch (e: unknown) {
        return e;
      }
    })() as DataProviderError;

    expect(error).toBeInstanceOf(DataProviderError);
    expect(error.kind).toBe("schema");
    expect(error.message).toMatch(/per-match file/);
  });
});

describe("lifted coordinates", () => {
  it("lifts positions[0] to x/y on every event that has one", () => {
    for (const event of events) {
      const start = event.positions[0];
      if (!start) continue;
      expect(event.x).toBe(start.x);
      expect(event.y).toBe(start.y);
    }
  });

  it("lifts positions[1] to endX/endY for a pass", () => {
    const pass = events.find((e) => e.eventName === "Pass" && e.positions.length > 1);
    expect(pass?.endX).toBe(pass?.positions[1]?.x);
    expect(pass?.endY).toBe(pass?.positions[1]?.y);
  });

  it("does NOT lift an end coordinate for a shot, whose positions[1] is a placeholder", () => {
    const shots = events.filter((e) => e.eventName === "Shot");
    expect(shots.length).toBeGreaterThan(2);

    for (const shot of shots) {
      // The raw array still has two entries — we just refuse to call the
      // second one a location.
      expect(shot.positions).toHaveLength(2);
      expect(shot.endX).toBeUndefined();
      expect(shot.endY).toBeUndefined();
    }

    // Both placeholder spellings are present in the fixture, so this isn't
    // passing because only one of them was covered.
    const placeholders = shots.map((s) => `${s.positions[1]?.x},${s.positions[1]?.y}`);
    expect(new Set(placeholders)).toEqual(new Set(["100,100", "0,0"]));
  });

  it("withholds an end coordinate for Interruption and Offside too", () => {
    for (const event of events.filter((e) =>
      ["Interruption", "Offside"].includes(String(e.eventName)),
    )) {
      expect(event.endX).toBeUndefined();
    }
  });

  it("keeps a corner's real (100, 100) start, which a goal kick uses as a placeholder", () => {
    // The pair that makes value-based placeholder detection impossible: the
    // same coordinate is a real corner flag and a stand-in for "no position".
    // Two corners are in the fixture, one from each side: (100, 0) and
    // (100, 100). It's the latter that collides with the placeholder.
    const corner = events.find((e) => e.subEventName === "Corner" && e.y === 100);
    const goalKick = events.find((e) => e.subEventName === "Goal kick");

    expect(corner?.x).toBe(100);
    expect(corner?.y).toBe(100);
    expect(goalKick?.x).toBe(100);
    expect(goalKick?.y).toBe(100);
    // Both keep their raw values; neither is silently dropped or rewritten.
    expect(corner?.endX).toBe(90);
  });
});

describe("parseEvents", () => {
  it("surfaces a schema failure when handed the wrong file", () => {
    const error = (() => {
      try {
        parseEvents({ not: "an array" });
      } catch (e: unknown) {
        return e;
      }
    })() as DataProviderError;

    expect(error.kind).toBe("schema");
    expect(error.message).toMatch(/Expected an array of Wyscout events/);
  });

  it("names the offending index when one row is wrong", () => {
    const error = (() => {
      try {
        parseEvents([{ id: 1, eventName: "Pass", positions: [] }, { nope: true }]);
      } catch (e: unknown) {
        return e;
      }
    })() as DataProviderError;

    expect(error.message).toMatch(/events\[1\]/);
  });

  it("drops a malformed position rather than emitting NaN coordinates", () => {
    const [event] = parseEvents([
      { id: 1, eventName: "Pass", positions: [{ x: "50", y: 50 }, { x: 10, y: 20 }] },
    ]);
    // The bad entry is gone, so what was positions[1] is now the start.
    expect(event?.positions).toHaveLength(1);
    expect(event?.x).toBe(10);
  });
});

describe("parseCompetitions / parseTeams", () => {
  it("reads all seven competitions the dataset covers", () => {
    const competitions = parseCompetitions(competitionsFixture());
    expect(competitions).toHaveLength(7);
    expect(competitions.map((c) => c.wyId)).toContain(364); // English first division
  });

  it("rejects a competitions file missing wyId", () => {
    expect(() => parseCompetitions([{ name: "nope" }])).toThrow(/competitions\[0\]/);
  });

  it("rejects a teams file missing wyId", () => {
    expect(() => parseTeams([{ name: "nope" }])).toThrow(/teams\[0\]/);
  });
});
