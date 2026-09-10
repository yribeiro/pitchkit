import { describe, expect, it } from "vitest";
import { eventsFixture, threeSixtyFixture, threeSixtyMatchEventsFixture } from "./fixtures.js";
import { parseEvents, parseThreeSixty } from "./parse.js";
import {
  actorIn,
  carries,
  indexThreeSixtyByEvent,
  isCarry,
  isPass,
  isShot,
  keeperIn,
  ofType,
  opponentsIn,
  passes,
  shots,
  teammatesIn,
  visibleAreaPolygon,
} from "./select.js";
import type { StatsBombEvent } from "./types.js";

const events = parseEvents(eventsFixture());
const threeSixtyEvents = parseEvents(threeSixtyMatchEventsFixture());
const frames = parseThreeSixty(threeSixtyFixture());

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

describe("indexThreeSixtyByEvent", () => {
  it("joins every frame to its real event by event_uuid === event.id", () => {
    const index = indexThreeSixtyByEvent(frames);
    expect(index.size).toBe(frames.length);

    for (const event of threeSixtyEvents) {
      const frame = index.get(event.id);
      expect(frame).toBeDefined();
      expect(frame?.event_uuid).toBe(event.id);
    }
  });

  it("misses for an event with no 360 coverage, rather than throwing", () => {
    const index = indexThreeSixtyByEvent(frames);
    expect(index.get("not-a-real-id")).toBeUndefined();
  });
});

describe("360 frame selectors", () => {
  it("teammatesIn and opponentsIn partition the frame without overlap", () => {
    for (const frame of frames) {
      const teammates = teammatesIn(frame);
      const opponents = opponentsIn(frame);
      expect(teammates.length + opponents.length).toBe(frame.freeze_frame.length);
      expect(new Set([...teammates, ...opponents]).size).toBe(frame.freeze_frame.length);
    }
  });

  it("actorIn finds exactly the one player StatsBomb marks as the actor", () => {
    for (const frame of frames) {
      const actor = actorIn(frame);
      expect(actor).toBeDefined();
      expect(actor?.actor).toBe(true);
      expect(frame.freeze_frame.filter((player) => player.actor)).toHaveLength(1);
    }
  });

  it("keeperIn finds a tracked keeper when the camera could see one", () => {
    const withKeeper = frames.filter((frame) => frame.freeze_frame.some((player) => player.keeper));
    expect(withKeeper.length).toBeGreaterThan(0);
    for (const frame of withKeeper) {
      expect(keeperIn(frame)?.keeper).toBe(true);
    }
  });

  it("keeperIn returns undefined when no keeper is in view", () => {
    const withoutKeeper = frames.find(
      (frame) => !frame.freeze_frame.some((player) => player.keeper),
    );
    expect(withoutKeeper).toBeDefined();
    expect(keeperIn(withoutKeeper as (typeof frames)[number])).toBeUndefined();
  });
});

describe("visibleAreaPolygon", () => {
  it("pairs StatsBomb's flat [x0, y0, x1, y1, ...] into point tuples", () => {
    for (const frame of frames) {
      const polygon = visibleAreaPolygon(frame);
      expect(polygon.length).toBe(frame.visible_area.length / 2);
      for (const [i, point] of polygon.entries()) {
        expect(point).toEqual([frame.visible_area[i * 2], frame.visible_area[i * 2 + 1]]);
      }
    }
  });

  it("covers every visible_area length the fixture carries (a hexagon, pentagon and heptagon)", () => {
    const lengths = new Set(frames.map((frame) => visibleAreaPolygon(frame).length));
    expect(lengths).toEqual(new Set([5, 6, 7]));
  });
});
