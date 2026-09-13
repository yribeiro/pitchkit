import { describe, expect, it } from "vitest";
import { dynamicEventsFixture, matchFixture, phasesFixture, trackingFixture } from "./fixtures.js";
import { parseDynamicEvents, parseMatch, parsePhasesOfPlay, parseTracking } from "./parse.js";
import {
  detectedPlayers,
  framesInPhase,
  inPlayFrames,
  indexPlayersById,
  isOffBallRun,
  ofEventType,
  offBallRuns,
  onBallEngagements,
  passingOptions,
  playerPossessions,
  playersOfTeam,
} from "./select.js";
import {
  hasLocation,
  hasPath,
  isCarry,
  isCompletePass,
  isDetected,
  isRunSubtype,
  leadToGoal,
  leadToShot,
} from "./predicates.js";

const match = parseMatch(matchFixture());
const events = parseDynamicEvents(dynamicEventsFixture(), match);
const frames = parseTracking(trackingFixture(), match);
const phases = parsePhasesOfPlay(phasesFixture(), match);

describe("selectors", () => {
  it("narrow to the counts the fixture was cut with", () => {
    expect(playerPossessions(events)).toHaveLength(20);
    expect(passingOptions(events)).toHaveLength(20);
    expect(offBallRuns(events)).toHaveLength(15);
    expect(onBallEngagements(events)).toHaveLength(15);
  });

  it("partition the feed exactly — nothing double-counted or dropped", () => {
    const total =
      playerPossessions(events).length +
      passingOptions(events).length +
      offBallRuns(events).length +
      onBallEngagements(events).length;
    expect(total).toBe(events.length);
  });

  it("reach types the package doesn't model through ofEventType", () => {
    expect(ofEventType(events, "off_ball_run")).toHaveLength(15);
    expect(ofEventType(events, "not_a_real_type")).toHaveLength(0);
  });

  it("give a guard that narrows for the type checker", () => {
    const run = events.find(isOffBallRun);
    if (!run) throw new Error("expected an off-ball run in the fixture");
    // Reading a run-only field compiles because the guard narrowed it.
    expect(run.distance_covered === null || typeof run.distance_covered === "number").toBe(true);
  });
});

describe("joining tracking to the match", () => {
  const players = indexPlayersById(match);

  it("indexes on players[].id, the id tracking actually carries", () => {
    const tracked = frames.flatMap((frame) => frame.player_data);
    const resolved = tracked.filter((player) => players.has(player.player_id));
    // Every tracked player must resolve; trackable_object would match none.
    expect(resolved).toHaveLength(tracked.length);
  });

  it("splits a frame into two teams", () => {
    const frame = frames.find((f) => f.player_data.length === 22);
    if (!frame) throw new Error("expected a fully tracked frame");
    const home = playersOfTeam(frame, match.home_team.id, players);
    const away = playersOfTeam(frame, match.away_team.id, players);
    expect(home.length + away.length).toBe(22);
    expect(home.length).toBeGreaterThan(0);
    expect(away.length).toBeGreaterThan(0);
  });

  it("separates seen positions from extrapolated ones", () => {
    const frame = frames.find((f) => f.player_data.length === 22);
    if (!frame) throw new Error("expected a fully tracked frame");
    expect(detectedPlayers(frame).every(isDetected)).toBe(true);
    expect(detectedPlayers(frame).length).toBeLessThanOrEqual(frame.player_data.length);
  });

  it("drops pre-kickoff frames from inPlayFrames", () => {
    expect(inPlayFrames(frames).length).toBeLessThan(frames.length);
    expect(inPlayFrames(frames).every((frame) => frame.period !== null)).toBe(true);
  });

  it("selects the frames inside a phase by frame number", () => {
    const [phase] = phases;
    if (!phase) throw new Error("expected a phase in the fixture");
    const inside = framesInPhase(frames, phase);
    for (const frame of inside) {
      expect(frame.frame).toBeGreaterThanOrEqual(phase.frame_start);
      expect(frame.frame).toBeLessThanOrEqual(phase.frame_end);
    }
  });
});

describe("predicates", () => {
  it("compose with .filter() over the narrowed types", () => {
    const carries = playerPossessions(events).filter(isCarry);
    const complete = playerPossessions(events).filter(isCompletePass);
    expect(carries.length).toBeGreaterThanOrEqual(0);
    expect(complete.every((p) => p.pass_outcome === "successful")).toBe(true);
  });

  it("build a subtype filter", () => {
    const runs = offBallRuns(events);
    const subtype = runs.find((run) => run.event_subtype !== null)?.event_subtype;
    if (subtype) {
      const matching = runs.filter(isRunSubtype(subtype));
      expect(matching.length).toBeGreaterThan(0);
      expect(matching.every((run) => run.event_subtype === subtype)).toBe(true);
    }
  });

  it("treat a missing flag as false rather than throwing", () => {
    expect(events.filter(leadToShot).every((e) => e.lead_to_shot === true)).toBe(true);
    expect(events.filter(leadToGoal).every((e) => e.lead_to_goal === true)).toBe(true);
  });

  it("separate plottable events from ones with no position", () => {
    const located = events.filter(hasLocation);
    expect(located.length).toBeGreaterThan(0);
    expect(located.every((e) => typeof e.pitchX === "number")).toBe(true);
    // hasPath is strictly stronger: every path also has a location.
    expect(events.filter(hasPath).every(hasLocation)).toBe(true);
  });
});
