import { describe, expect, it } from "vitest";
import { DataProviderError } from "../errors.js";
import { pitchProjection, projectOrNull } from "./coordinates.js";
import { dynamicEventsFixture, matchFixture, phasesFixture } from "./fixtures.js";
import { parseDynamicEvents, parseMatch, parsePhasesOfPlay, parseTrackingFrame } from "./parse.js";
import {
  breaksDefensiveLine,
  inAttackingThird,
  inPenaltyArea,
  isDangerous,
  isOneTouch,
  isPhaseType,
  isRunBehind,
  isSprint,
  phaseLedToGoal,
  phaseLedToShot,
  wasReceived,
  wasTargeted,
} from "./predicates.js";
import { offBallRuns, passingOptions, playerPossessions } from "./select.js";
import type {
  SkillCornerEvent,
  SkillCornerEventBase,
  SkillCornerOffBallRun,
  SkillCornerPassingOption,
  SkillCornerPhase,
  SkillCornerPlayerPossession,
} from "./types.js";

const match = parseMatch(matchFixture());
const events = parseDynamicEvents(dynamicEventsFixture(), match);
const phases = parsePhasesOfPlay(phasesFixture(), match);

// Widened to the base once, so the builders below spread a single interface
// rather than the event union — spreading the union distributes and TypeScript
// stops recognising the result as an event at all.
const [firstEvent] = events;
const [firstPhase] = phases;
if (!firstEvent || !firstPhase) throw new Error("fixtures are missing rows");
const baseEvent: SkillCornerEventBase = firstEvent;

/**
 * Each predicate reads one SkillCorner field, so they're checked against
 * hand-built rows as well as the fixture: the fixture proves they run over
 * real data, these prove they answer correctly in both directions — which a
 * fixture that happens to contain only `false` never would.
 */
function event(fields: Partial<SkillCornerEventBase>): SkillCornerEvent {
  return { ...baseEvent, ...fields } as SkillCornerEvent;
}
function run(fields: Partial<SkillCornerOffBallRun>): SkillCornerOffBallRun {
  return { ...baseEvent, event_type: "off_ball_run", ...fields } as SkillCornerOffBallRun;
}
function option(fields: Partial<SkillCornerPassingOption>): SkillCornerPassingOption {
  return { ...baseEvent, event_type: "passing_option", ...fields } as SkillCornerPassingOption;
}
function possession(fields: Partial<SkillCornerPlayerPossession>): SkillCornerPlayerPossession {
  return {
    ...baseEvent,
    event_type: "player_possession",
    ...fields,
  } as SkillCornerPlayerPossession;
}
function phase(fields: Partial<SkillCornerPhase>): SkillCornerPhase {
  return { ...firstPhase, ...fields } as SkillCornerPhase;
}

describe("off-ball run predicates", () => {
  it("answer both ways, and treat null as false", () => {
    expect(breaksDefensiveLine(run({ break_defensive_line: true }))).toBe(true);
    expect(breaksDefensiveLine(run({ break_defensive_line: false }))).toBe(false);
    expect(breaksDefensiveLine(run({ break_defensive_line: null }))).toBe(false);

    expect(isRunBehind(run({ intended_run_behind: true }))).toBe(true);
    expect(isRunBehind(run({ intended_run_behind: null }))).toBe(false);

    // SkillCorner's own band, not a speed threshold invented here.
    expect(isSprint(run({ speed_avg_band: "sprinting" }))).toBe(true);
    expect(isSprint(run({ speed_avg_band: "jogging" }))).toBe(false);
    expect(isSprint(run({ speed_avg_band: null }))).toBe(false);
  });

  it("run over the real fixture without throwing", () => {
    const runs = offBallRuns(events);
    expect(runs.filter(breaksDefensiveLine).every(breaksDefensiveLine)).toBe(true);
    expect(runs.filter(isSprint).every((r) => r.speed_avg_band === "sprinting")).toBe(true);
  });
});

describe("passing-option predicates", () => {
  it("answer both ways", () => {
    expect(wasTargeted(option({ targeted: true }))).toBe(true);
    expect(wasTargeted(option({ targeted: false }))).toBe(false);
    expect(wasReceived(option({ received: true }))).toBe(true);
    expect(wasReceived(option({ received: null }))).toBe(false);
    expect(isDangerous(option({ dangerous: true }))).toBe(true);
    expect(isDangerous(option({ dangerous: null }))).toBe(false);
  });

  it("run over the real fixture", () => {
    expect(passingOptions(events).filter(wasReceived).every(wasReceived)).toBe(true);
  });
});

describe("possession predicates", () => {
  it("read pass_outcome explicitly, unlike StatsBomb's absent-means-complete", () => {
    expect(isOneTouch(possession({ one_touch: true }))).toBe(true);
    expect(isOneTouch(possession({ one_touch: null }))).toBe(false);
    expect(playerPossessions(events).length).toBeGreaterThan(0);
  });
});

describe("location predicates", () => {
  it("read SkillCorner's own zone labels", () => {
    expect(inAttackingThird(event({ third_start: "attacking_third" }))).toBe(true);
    expect(inAttackingThird(event({ third_start: "middle_third" }))).toBe(false);
    expect(inAttackingThird(event({ third_start: null }))).toBe(false);
    expect(inPenaltyArea(event({ penalty_area_start: true }))).toBe(true);
    expect(inPenaltyArea(event({ penalty_area_start: false }))).toBe(false);
  });
});

describe("phase predicates", () => {
  it("filter by phase type and outcome", () => {
    expect(phaseLedToShot(phase({ team_possession_lead_to_shot: true }))).toBe(true);
    expect(phaseLedToShot(phase({ team_possession_lead_to_shot: null }))).toBe(false);
    expect(phaseLedToGoal(phase({ team_possession_lead_to_goal: true }))).toBe(true);
    expect(phaseLedToGoal(phase({ team_possession_lead_to_goal: false }))).toBe(false);

    const build = isPhaseType("build_up");
    expect(build(phase({ team_in_possession_phase_type: "build_up" }))).toBe(true);
    expect(build(phase({ team_in_possession_phase_type: "counter" }))).toBe(false);
  });
});

describe("coordinate edge cases", () => {
  const project = pitchProjection(match);

  it("returns nulls unless both halves of a pair are real numbers", () => {
    expect(projectOrNull(project, 1, 2)).toEqual([53.5, 36]);
    expect(projectOrNull(project, 1, null)).toEqual([null, null]);
    expect(projectOrNull(project, null, 2)).toEqual([null, null]);
    expect(projectOrNull(project, undefined, undefined)).toEqual([null, null]);
    // NaN is a number but not a position.
    expect(projectOrNull(project, Number.NaN, 2)).toEqual([null, null]);
    expect(projectOrNull(project, Number.POSITIVE_INFINITY, 2)).toEqual([null, null]);
  });

  it("rejects non-numeric pitch dimensions", () => {
    expect(() => pitchProjection({ pitch_length: Number.NaN, pitch_width: 68 })).toThrow(
      RangeError,
    );
    expect(() => pitchProjection({ pitch_length: 105, pitch_width: -1 })).toThrow(RangeError);
  });
});

describe("parseTrackingFrame edge cases", () => {
  const project = pitchProjection(match);

  it("rejects something that isn't a frame", () => {
    expect(() => parseTrackingFrame({ nope: true }, project)).toThrow(DataProviderError);
    expect(() => parseTrackingFrame(null, project)).toThrow(/tracking frame/);
    expect(() => parseTrackingFrame([1, 2, 3], project)).toThrow(/an array of 3/);
  });

  it("tolerates a missing ball_data object", () => {
    const frame = parseTrackingFrame({ frame: 7 }, project);
    expect(frame.ball_data.x).toBeNull();
    expect(frame.ballPitchX).toBeNull();
    expect(frame.player_data).toEqual([]);
  });

  it("skips player entries with no usable position rather than emitting NaN", () => {
    const frame = parseTrackingFrame(
      {
        frame: 8,
        player_data: [
          { player_id: 1, x: 0, y: 0, is_detected: true },
          { player_id: 2, x: null, y: 3, is_detected: false },
          "not an object",
        ],
      },
      project,
    );
    expect(frame.player_data).toHaveLength(1);
    expect(frame.player_data[0]?.pitchX).toBe(52.5);
  });
});
