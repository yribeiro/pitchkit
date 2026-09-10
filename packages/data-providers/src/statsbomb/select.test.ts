import { describe, expect, it } from "vitest";
import { eventsFixture } from "./fixtures.js";
import { parseEvents } from "./parse.js";
import { carries, isCarry, isPass, isShot, ofType, passes, shots } from "./select.js";
import type { StatsBombEvent } from "./types.js";

const events = parseEvents(eventsFixture());

describe("selectors", () => {
  it("picks out shots, passes and carries", () => {
    expect(shots(events)).toHaveLength(5);
    expect(passes(events)).toHaveLength(11);
    expect(carries(events)).toHaveLength(3);
  });

  it("narrows to the sub-object, which is the whole point of going through a guard", () => {
    for (const shot of shots(events)) {
      expect(typeof shot.shot.statsbomb_xg).toBe("number");
      expect(typeof shot.x).toBe("number");
    }
    for (const pass of passes(events)) {
      expect(typeof pass.pass.length).toBe("number");
    }
    for (const carry of carries(events)) {
      expect(carry.carry.end_location).toBeInstanceOf(Array);
    }
  });

  it("partitions the feed without overlap", () => {
    const typed = [...shots(events), ...passes(events), ...carries(events)];
    expect(new Set(typed.map((event) => event.id)).size).toBe(typed.length);
  });
});

describe("guards", () => {
  it("require the sub-object, not just a matching type name", () => {
    // A truncated or hand-built event that claims to be a shot but carries
    // no `shot` object must not narrow — otherwise the guard hands back a
    // type that lies about what's there.
    const liar = { type: { id: 16, name: "Shot" } } as unknown as StatsBombEvent;
    expect(isShot(liar)).toBe(false);
    expect(isPass(liar)).toBe(false);
    expect(isCarry(liar)).toBe(false);
  });

  it("are usable directly in a caller's own filter", () => {
    const firstHalfShots = events.filter(isShot).filter((shot) => shot.period === 1);
    expect(firstHalfShots.length).toBeGreaterThan(0);
  });
});

describe("ofType", () => {
  it("reaches event types the package does not model", () => {
    const duels = ofType(events, "Duel");
    expect(duels).toHaveLength(1);
    // The type-specific sub-object is still there, just untyped.
    expect(duels[0]?.duel).toBeDefined();
  });

  it("returns an empty array for a type not in the feed", () => {
    expect(ofType(events, "Own Goal Against")).toEqual([]);
  });

  it("matches StatsBomb's own type names verbatim, asterisk and all", () => {
    expect(ofType(events, "Ball Receipt*")).toHaveLength(1);
  });
});
