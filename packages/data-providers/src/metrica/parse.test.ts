import { describe, expect, it } from "vitest";
import { DataProviderError } from "../errors.js";
import {
  awayTrackingFixture,
  eventsFixture,
  game2AwayTrackingFixture,
  game2EventsFixture,
  homeTrackingFixture,
} from "./fixtures.js";
import { parseEvents, parseTracking, parseTrackingLayout, parseTrackingRow } from "./parse.js";

describe("parseEvents", () => {
  const events = parseEvents(eventsFixture());

  it("keeps every row, with Metrica's headers as the keys", () => {
    expect(events).toHaveLength(56);
    expect(events[1]).toMatchObject({
      Team: "Away",
      Type: "PASS",
      Subtype: null,
      Period: 1,
      "Start Frame": 1,
      "Start Time [s]": 0.04,
      "End Frame": 3,
      From: "Player19",
      To: "Player21",
      "Start X": 0.45,
      "End Y": 0.43,
    });
  });

  it("lifts start and end positions to x/y/endX/endY", () => {
    expect(events[1]).toMatchObject({ x: 0.45, y: 0.39, endX: 0.55, endY: 0.43 });
  });

  it("reads NaN as null and leaves the lifted fields absent", () => {
    const kickOff = events[0];
    expect(kickOff?.Subtype).toBe("KICK OFF");
    expect(kickOff?.["Start X"]).toBeNull();
    expect(kickOff?.To).toBeNull();
    expect(kickOff).not.toHaveProperty("x");
    expect(kickOff).not.toHaveProperty("endX");
    // The opening kick-off's End Frame is 0 in the file, and stays 0.
    expect(kickOff?.["End Frame"]).toBe(0);
  });

  it("keeps a start position while withholding a missing end", () => {
    const recovery = events.find((event) => event.Type === "RECOVERY");
    expect(recovery?.x).toBeTypeOf("number");
    expect(recovery).not.toHaveProperty("endX");
  });

  it("keeps end positions beyond the goal line", () => {
    const goal = events.find((event) => event.Subtype === "HEAD-ON TARGET-GOAL");
    expect(goal?.endX).toBe(1.01);
  });

  it("keeps player names verbatim, including Game 2's 'Player 26'", () => {
    expect(parseEvents(game2EventsFixture()).map((event) => event.From)).toContain("Player 26");
  });

  it("passes through columns it doesn't know", () => {
    const [event] = parseEvents("Type,Start Frame,Extra\nPASS,1,hello\n");
    expect(event?.Extra).toBe("hello");
  });

  it("rejects empty text and a tracking file", () => {
    expect(() => parseEvents("")).toThrow(DataProviderError);
    expect(() => parseEvents(homeTrackingFixture())).toThrow(/RawEventsData/);
  });

  it("reports unreadable CSV as a parse error", () => {
    expect(() => parseEvents('Type,Start Frame\n"PASS,1\n')).toThrow(
      expect.objectContaining({ kind: "parse" }),
    );
  });

  it("returns nothing for a header with no rows", () => {
    expect(parseEvents("Team,Type,Start Frame\n")).toEqual([]);
  });
});

describe("parseTracking", () => {
  const frames = parseTracking(homeTrackingFixture(), awayTrackingFixture());

  it("merges the two teams' files frame by frame", () => {
    expect(frames).toHaveLength(151);
    expect(frames[0]).toMatchObject({ Period: 1, Frame: 2250, "Time [s]": 90 });
    expect(frames.at(-1)?.Frame).toBe(2400);
  });

  it("lists home players before away, each with team, name and jersey", () => {
    const frame = frames[0];
    expect(frame?.players[0]).toMatchObject({ team: "Home", player: "Player11", jersey: 11 });
    expect(frame?.players.at(-1)?.team).toBe("Away");
  });

  it("leaves out players who aren't on the pitch", () => {
    // Each side lists 14 players, and the three substitutes are NaN.
    expect(frames[0]?.players).toHaveLength(22);
    expect(frames[0]?.players.some((p) => p.player === "Player12")).toBe(false);
  });

  it("puts the scorer at the event's start position on the goal's frame", () => {
    // The opening goal: Player9, start frame 2289, at (0.92, 0.47).
    const scorer = frames
      .find((frame) => frame.Frame === 2289)
      ?.players.find((p) => p.player === "Player9");
    expect(scorer?.x).toBeCloseTo(0.92, 1);
    expect(scorer?.y).toBeCloseTo(0.47, 1);
  });

  it("reads an untracked ball as null", () => {
    expect(frames.some((frame) => frame.ball === null)).toBe(true);
    expect(frames[0]?.ball).toEqual({ x: expect.any(Number), y: expect.any(Number) });
  });

  it("keeps Game 2's 'Player 26' spelled as the header spells it", () => {
    const layout = parseTrackingLayout(game2AwayTrackingFixture().split("\n").slice(0, 3));
    expect(layout.players.map((p) => p.player)).toContain("Player 26");
  });

  it("rejects files from different games, or of different lengths", () => {
    const home = homeTrackingFixture();
    expect(() => parseTracking(home, game2AwayTrackingFixture())).toThrow(/different lengths/);
    const lines = awayTrackingFixture().split("\n");
    const shifted = [...lines.slice(0, 3), ...lines.slice(4), lines[3] ?? ""].join("\n");
    expect(() => parseTracking(home, shifted)).toThrow(/out of step/);
  });

  it("rejects empty text and an events file", () => {
    expect(() => parseTracking("", awayTrackingFixture())).toThrow(/home team/);
    expect(() => parseTracking(homeTrackingFixture(), eventsFixture())).toThrow(/RawTrackingData/);
  });
});

describe("parseTrackingRow", () => {
  const layout = parseTrackingLayout(homeTrackingFixture().split("\n").slice(0, 3));

  it("rejects a cut-off or non-numeric line rather than half-parsing it", () => {
    expect(parseTrackingRow("", layout)).toBeNull();
    expect(parseTrackingRow("1,2250", layout)).toBeNull();
    const row = homeTrackingFixture().split("\n")[3] ?? "";
    expect(parseTrackingRow(`x${row}`, layout)).toBeNull();
  });

  it("tolerates Windows line endings", () => {
    const row = homeTrackingFixture().split("\n")[3] ?? "";
    expect(parseTrackingRow(`${row}\r`, layout)?.ball).toEqual(parseTrackingRow(row, layout)?.ball);
  });

  it("has no ball when the file has no ball columns", () => {
    const noBall = parseTrackingLayout([",,,Home,", ",,,1,", "Period,Frame,Time [s],Player1,"]);
    expect(noBall.ballColumn).toBe(-1);
    expect(parseTrackingRow("1,1,0.04,0.5,0.5", noBall)?.ball).toBeNull();
  });
});
