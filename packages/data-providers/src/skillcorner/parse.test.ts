import { describe, expect, it } from "vitest";
import { DataProviderError } from "../errors.js";
import { attackingSideOf, pitchProjection } from "./coordinates.js";
import {
  dynamicEventsFixture,
  matchFixture,
  matchesFixture,
  phasesFixture,
  trackingFixture,
} from "./fixtures.js";
import {
  parseDynamicEvents,
  parseMatch,
  parseMatches,
  parsePhasesOfPlay,
  parseTracking,
} from "./parse.js";
import type { SkillCornerMatch } from "./types.js";

const match = parseMatch(matchFixture());

describe("parseMatches", () => {
  it("reads the index", () => {
    const matches = parseMatches(matchesFixture());
    expect(matches).toHaveLength(20);
    expect(matches[0]?.home_team.short_name).toBeTypeOf("string");
  });

  it("rejects a single match file with a message naming the mix-up", () => {
    expect(() => parseMatches(matchFixture())).toThrow(DataProviderError);
    expect(() => parseMatches(matchFixture())).toThrow(/matches index/);
  });
});

describe("parseMatch", () => {
  it("keeps SkillCorner's own fields", () => {
    expect(match.id).toBe(1874553);
    expect(match.pitch_length).toBe(105);
    expect(match.pitch_width).toBe(68);
    expect(match.home_team_side).toEqual(["left_to_right", "right_to_left"]);
    expect(match.players.length).toBeGreaterThan(20);
  });

  it("refuses a match with no pitch dimensions, since coordinates need them", () => {
    const { pitch_length: _l, pitch_width: _w, ...rest } = match;
    expect(() => parseMatch(rest)).toThrow(/pitch_length/);
  });
});

describe("parseTracking", () => {
  const frames = parseTracking(trackingFixture(), match);

  it("parses every line, including the empty pre-kickoff ones", () => {
    expect(frames).toHaveLength(123);
    const empty = frames.filter((frame) => frame.period === null);
    expect(empty.length).toBeGreaterThan(0);
    expect(empty[0]?.player_data).toEqual([]);
    expect(empty[0]?.ballPitchX).toBeNull();
  });

  it("lifts player coordinates to a corner origin", () => {
    const frame = frames.find((f) => f.player_data.length === 22);
    if (!frame) throw new Error("expected a fully tracked frame in the fixture");

    for (const player of frame.player_data) {
      expect(player.pitchX).toBeCloseTo(player.x + 105 / 2, 10);
      expect(player.pitchY).toBeCloseTo(player.y + 68 / 2, 10);
      // Broadcast tracking can place a player just off the touchline, so the
      // assertion is "on the same scale", not "strictly inside the pitch".
      expect(player.pitchX).toBeGreaterThan(-5);
      expect(player.pitchX).toBeLessThan(110);
    }
  });

  it("keeps is_detected, because an extrapolated position is not a measurement", () => {
    const tracked = frames.flatMap((frame) => frame.player_data);
    const detected = tracked.filter((player) => player.is_detected);
    expect(detected.length).toBeGreaterThan(0);
    expect(detected.length).toBeLessThan(tracked.length);
  });

  it("reports a truncated read as a parse error rather than dropping frames", () => {
    const truncated = trackingFixture().slice(0, 900);
    expect(() => parseTracking(truncated, match)).toThrow(DataProviderError);
    expect(() => parseTracking(truncated, match)).toThrow(/JSONL/);
  });
});

describe("parseDynamicEvents", () => {
  const events = parseDynamicEvents(dynamicEventsFixture(), match);

  it("reads every row and keeps unmodelled columns", () => {
    expect(events).toHaveLength(70);
    // A column this package deliberately doesn't type, still reachable.
    expect(events[0]).toHaveProperty("possession_epv_total");
  });

  it("coerces SkillCorner's Python-style booleans and empty-string nulls", () => {
    const withArea = events.filter((event) => typeof event.penalty_area_start === "boolean");
    expect(withArea.length).toBeGreaterThan(0);
    // An empty cell must be null, never the string "" or NaN.
    const blanks = events.filter((event) => event.event_subtype === null);
    expect(blanks.length).toBeGreaterThan(0);
    expect(events.every((event) => !Number.isNaN(event.xthreat as number))).toBe(true);
  });

  it("lifts start and end coordinates, leaving half-pairs null", () => {
    const located = events.filter((event) => typeof event.pitchX === "number");
    expect(located.length).toBeGreaterThan(0);
    for (const event of located) {
      expect(event.pitchX).toBeCloseTo((event.x_start as number) + 52.5, 10);
      expect(event.pitchY).toBeCloseTo((event.y_start as number) + 34, 10);
    }
  });

  it("keeps the event types SkillCorner ships", () => {
    const types = new Set(events.map((event) => event.event_type));
    expect(types).toEqual(
      new Set(["player_possession", "passing_option", "off_ball_run", "on_ball_engagement"]),
    );
  });
});

describe("parsePhasesOfPlay", () => {
  it("reads phases with their frame bounds", () => {
    const phases = parsePhasesOfPlay(phasesFixture(), match);
    expect(phases).toHaveLength(40);
    for (const phase of phases) {
      expect(phase.frame_end).toBeGreaterThanOrEqual(phase.frame_start);
    }
  });
});

describe("pitchProjection", () => {
  it("translates by half the match's own dimensions", () => {
    const project = pitchProjection({ pitch_length: 106, pitch_width: 68 });
    expect(project(0, 0)).toEqual([53, 34]);
    expect(project(-53, -34)).toEqual([0, 0]);
    expect(project.length).toBe(106);
    expect(project.width).toBe(68);
  });

  it("puts the attacker's left at high y, matching a y-up pitch", () => {
    // Verified against the dataset: every `wide_left` row has y > 0.
    const project = pitchProjection(match);
    const [, leftY] = project(0, 30);
    const [, rightY] = project(0, -30);
    expect(leftY).toBeGreaterThan(rightY);
  });

  it("refuses unusable dimensions rather than silently centring on NaN", () => {
    expect(() => pitchProjection({ pitch_length: 0, pitch_width: 68 })).toThrow(RangeError);
  });
});

describe("attackingSideOf", () => {
  it("flips the away team and swaps both at half time", () => {
    const home = match.home_team.id;
    const away = match.away_team.id;
    expect(attackingSideOf(match, home, 1)).toBe("left_to_right");
    expect(attackingSideOf(match, away, 1)).toBe("right_to_left");
    expect(attackingSideOf(match, home, 2)).toBe("right_to_left");
    expect(attackingSideOf(match, away, 2)).toBe("left_to_right");
  });

  it("returns undefined for a period the match file doesn't describe", () => {
    expect(attackingSideOf(match, match.home_team.id, 3)).toBeUndefined();
  });

  it("returns undefined rather than guessing when home_team_side is missing", () => {
    const odd = { ...match, home_team_side: [] } as unknown as SkillCornerMatch;
    expect(attackingSideOf(odd, odd.home_team.id, 1)).toBeUndefined();
  });
});
