import { describe, expect, it } from "vitest";
import { eventsFixture, matchesFixture, playersFixture, squadsFixture } from "./fixtures.js";
import { parseEvents, parseMatches, parsePlayers, parseSquads } from "./parse.js";
import {
  byPlayer,
  byTeam,
  indexPlayersById,
  indexSquadsById,
  inMatchOrder,
  inPeriod,
  matchSeconds,
  ofType,
  passes,
  score,
  shots,
} from "./select.js";
import type { ImpectEvent } from "./types.js";

const events = parseEvents(eventsFixture());
const [match] = parseMatches(matchesFixture());

describe("selectors", () => {
  it("narrow by action type", () => {
    expect(shots(events)).toHaveLength(3);
    expect(ofType(events, "CORNER")).toHaveLength(1);
  });

  it("leave set pieces out of passes, though they carry a pass", () => {
    expect(passes(events).map((event) => event.action)).toEqual(["LOW_PASS", "HIGH_CROSS"]);
    expect(events.filter((event) => event.pass !== null)).toHaveLength(6);
  });

  it("narrow by team, player and period", () => {
    expect(byTeam(events, 2).every((event) => event.squadId === 2)).toBe(true);
    expect(byPlayer(events, 14).map((event) => event.actionType)).toEqual(["SHOT", "GOAL"]);
    expect(inPeriod(events, 2)).toHaveLength(6);
  });
});

describe("the match clock", () => {
  it("puts the second half at 45:00, not at 10,000 seconds", () => {
    const secondHalfKickOff = inPeriod(events, 2)[0] as ImpectEvent;
    expect(secondHalfKickOff.gameTime.gameTimeInSec).toBe(10_000);
    expect(matchSeconds(secondHalfKickOff)).toBe(2_700);
    expect(matchSeconds(events[5] as ImpectEvent)).toBe(30);
  });

  it("handles extra time, and an unknown period as the first", () => {
    const at = (periodId: number, gameTimeInSec: number) =>
      matchSeconds({
        ...(events[0] as ImpectEvent),
        periodId,
        gameTime: { gameTime: "", gameTimeInSec },
      });
    expect(at(3, 20_060)).toBe(5_460);
    expect(at(4, 30_000)).toBe(6_300);
    expect(at(9, 12)).toBe(12);
  });

  it("sorts on gameTimeInSec, which orders stoppage time correctly", () => {
    const shuffled = [...events].reverse();
    expect(inMatchOrder(shuffled).map((event) => event.index)).toEqual(events.map((e) => e.index));
  });
});

describe("score", () => {
  it("counts own goals for the side that didn't score them", () => {
    expect(score(events, match!)).toEqual({ home: 2, away: 1 });
    // From GOAL events alone it would be 2-0.
    expect(ofType(events, "GOAL")).toHaveLength(2);
  });

  it("ignores goals by squads not in the match", () => {
    expect(score(events, { homeSquadId: 7, awaySquadId: 8 })).toEqual({ home: 0, away: 0 });
  });
});

describe("indexes", () => {
  it("key players and squads by id", () => {
    expect(indexPlayersById(parsePlayers(playersFixture())).get(14)?.commonname).toBe("Player 14");
    expect(indexSquadsById(parseSquads(squadsFixture())).get(2)?.name).toBe("Away FC");
  });
});
