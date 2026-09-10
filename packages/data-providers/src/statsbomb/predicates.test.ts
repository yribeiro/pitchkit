import { describe, expect, it } from "vitest";
import { eventsFixture } from "./fixtures.js";
import { parseEvents } from "./parse.js";
import {
  isAssist,
  isComplete,
  isCorner,
  isCross,
  isFreeKick,
  isGoal,
  isKeyPass,
  isOnTarget,
  isPenalty,
  isSetPiece,
  isSwitch,
  isThroughBall,
  isThrowIn,
} from "./predicates.js";
import { passes, shots } from "./select.js";
import type { StatsBombShot } from "./types.js";

const events = parseEvents(eventsFixture());
const allPasses = passes(events);
const allShots = shots(events);

describe("isComplete", () => {
  it("treats a missing pass.outcome as a completed pass", () => {
    // The trap this predicate exists for: StatsBomb records success as the
    // absence of an outcome, so a naive `outcome.name === "Complete"` finds
    // nothing at all.
    expect(allPasses.filter(isComplete)).toHaveLength(8);
    for (const pass of allPasses.filter(isComplete)) {
      expect(pass.pass.outcome).toBeUndefined();
    }
  });

  it("treats any recorded outcome as incomplete", () => {
    const incomplete = allPasses.filter((pass) => !isComplete(pass));
    expect(incomplete.length).toBeGreaterThan(0);
    for (const pass of incomplete) {
      expect(pass.pass.outcome?.name).toBeDefined();
    }
  });

  it("never reports a value StatsBomb spells as 'Complete'", () => {
    const outcomes = allPasses.map((pass) => pass.pass.outcome?.name);
    expect(outcomes).not.toContain("Complete");
  });
});

describe("pass-type predicates", () => {
  it("finds corners, free kicks and throw-ins by pass.type", () => {
    expect(allPasses.filter(isCorner)).toHaveLength(1);
    expect(allPasses.filter(isFreeKick)).toHaveLength(1);
    expect(allPasses.filter(isThrowIn)).toHaveLength(1);
  });

  it("finds crosses, through balls and switches by their boolean flags", () => {
    expect(allPasses.filter(isCross)).toHaveLength(1);
    expect(allPasses.filter(isThroughBall)).toHaveLength(1);
    expect(allPasses.filter(isSwitch)).toHaveLength(1);
  });

  it("composes with a selector, which is how a corner is reachable at all", () => {
    // A corner is not a StatsBomb event type — it's a kind of pass — so it
    // can only ever be a predicate over passes.
    const corners = passes(events).filter(isCorner);
    expect(corners[0]?.pass.type?.name).toBe("Corner");
  });
});

describe("isAssist / isKeyPass", () => {
  it("separates goal assists from shot assists", () => {
    expect(allPasses.filter(isAssist)).toHaveLength(1);
    // A key pass is either — a goal assist is also a key pass.
    expect(allPasses.filter(isKeyPass).length).toBeGreaterThanOrEqual(
      allPasses.filter(isAssist).length,
    );
    expect(allPasses.filter(isKeyPass)).toHaveLength(2);
  });
});

describe("isSetPiece", () => {
  it("covers passes that restarted play", () => {
    expect(allPasses.filter(isSetPiece)).toHaveLength(5);
  });

  it("also accepts shots, reading shot.type instead of pass.type", () => {
    const freeKicks = allShots.filter(isSetPiece);
    expect(freeKicks).toHaveLength(2);
    for (const shot of freeKicks) {
      expect(shot.shot.type.name).toBe("Free Kick");
    }
  });

  it("excludes open play", () => {
    const openPlay = allShots.filter((shot) => shot.shot.type.name === "Open Play");
    expect(openPlay.length).toBeGreaterThan(0);
    for (const shot of openPlay) expect(isSetPiece(shot)).toBe(false);
  });
});

describe("shot predicates", () => {
  it("finds goals", () => {
    expect(allShots.filter(isGoal)).toHaveLength(1);
    expect(allShots.filter(isGoal)[0]?.shot.outcome.name).toBe("Goal");
  });

  it("counts goals and saves as on target", () => {
    expect(allShots.filter(isOnTarget)).toHaveLength(2);
  });

  it("does not count a shot saved while going wide as on target", () => {
    // "Saved Off T" is a save on a shot that was missing anyway.
    const savedOffTarget = {
      shot: { outcome: { id: 101, name: "Saved Off T" }, type: { id: 87, name: "Open Play" } },
    } as unknown as StatsBombShot;
    expect(isOnTarget(savedOffTarget)).toBe(false);
  });

  it("finds penalties by shot.type", () => {
    // None in this fixture — the assertion is that we don't false-positive.
    expect(allShots.filter(isPenalty)).toHaveLength(0);

    const penalty = {
      shot: { outcome: { id: 97, name: "Goal" }, type: { id: 88, name: "Penalty" } },
    } as unknown as StatsBombShot;
    expect(isPenalty(penalty)).toBe(true);
    expect(isSetPiece(penalty)).toBe(true);
  });
});
