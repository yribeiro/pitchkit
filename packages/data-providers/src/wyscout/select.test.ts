import { describe, expect, it } from "vitest";
import { matchFixture } from "./fixtures.js";
import { parseMatch } from "./parse.js";
import { isGoal } from "./predicates.js";
import {
  byPlayer,
  byTeam,
  duels,
  fouls,
  freeKicks,
  inMatchOrder,
  indexPlayersById,
  matchSeconds,
  ofType,
  passes,
  shots,
  squadOf,
  teamIds,
} from "./select.js";

const match = parseMatch(matchFixture());
const events = match.events;

describe("selectors", () => {
  it("narrow the feed by Wyscout's own top-level eventName", () => {
    expect(shots(events).every((e) => e.eventName === "Shot")).toBe(true);
    expect(passes(events).length).toBeGreaterThan(shots(events).length);
    expect(duels(events).length).toBeGreaterThan(0);
    expect(fouls(events).length).toBeGreaterThan(0);
    expect(freeKicks(events).length).toBeGreaterThan(0);
  });

  it("ofType takes any type, including ones without a named selector", () => {
    expect(ofType(events, "Offside").length).toBeGreaterThan(0);
    expect(ofType(events, "Not A Type")).toEqual([]);
  });

  it("shots() is what makes isGoal count each goal once", () => {
    // The whole feed carries the goal tag twice — on the shot or free kick,
    // and again on the conceding keeper's save attempt.
    const everywhere = events.filter(isGoal);
    const onShots = shots(events).filter(isGoal);
    expect(everywhere.length).toBeGreaterThan(onShots.length);
  });
});

describe("byTeam / byPlayer", () => {
  it("split the feed without losing anything", () => {
    const [home, away] = teamIds(match);
    expect(home).toBeDefined();
    expect(away).toBeDefined();
    const split = byTeam(events, home as number).length + byTeam(events, away as number).length;
    expect(split).toBe(events.length);
  });

  it("byPlayer picks out one player's events", () => {
    const playerId = events[0]?.playerId as number;
    const theirs = byPlayer(events, playerId);
    expect(theirs.length).toBeGreaterThan(0);
    expect(theirs.every((e) => e.playerId === playerId)).toBe(true);
  });
});

describe("squads", () => {
  it("indexPlayersById turns an event's playerId into a name", () => {
    const index = indexPlayersById(match);
    expect(index.size).toBeGreaterThan(0);
    for (const [id, player] of index) {
      expect(player.wyId).toBe(id);
      expect(typeof player.shortName).toBe("string");
    }
  });

  it("squadOf reads one team's list, and is empty for an unknown team", () => {
    const [home] = teamIds(match);
    expect(squadOf(match, home as number).length).toBeGreaterThan(0);
    expect(squadOf(match, 999999)).toEqual([]);
  });
});

describe("matchSeconds", () => {
  it("offsets each period, because eventSec restarts at zero every half", () => {
    const firstHalf = events.find((e) => e.matchPeriod === "1H");
    const secondHalf = events.find((e) => e.matchPeriod === "2H");
    expect(firstHalf).toBeDefined();
    expect(secondHalf).toBeDefined();

    // The second-half event has a *smaller* raw eventSec than late first-half
    // events, so sorting on eventSec alone would interleave the halves.
    expect(matchSeconds(secondHalf!)).toBeGreaterThan(matchSeconds(firstHalf!));
    expect(matchSeconds(secondHalf!)).toBeGreaterThanOrEqual(2700);
  });

  it("inMatchOrder puts the halves in play order", () => {
    const ordered = inMatchOrder(events);
    expect(ordered).toHaveLength(events.length);
    for (let i = 1; i < ordered.length; i++) {
      expect(matchSeconds(ordered[i]!)).toBeGreaterThanOrEqual(matchSeconds(ordered[i - 1]!));
    }
    expect(ordered.at(-1)?.matchPeriod).toBe("2H");
  });
});
