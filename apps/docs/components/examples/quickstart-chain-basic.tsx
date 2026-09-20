"use client";

import { useEffect, useState } from "react";
import { Annotate, Arrows, Comet, Pitch, Scatter } from "@pitchkit/react";
import {
  fetchMatchEvents,
  isCarry,
  isGoal,
  isPass,
  shots,
} from "@pitchkit/data-providers/statsbomb";
import type {
  StatsBombCarry,
  StatsBombEvent,
  StatsBombPass,
  StatsBombShot,
} from "@pitchkit/data-providers/statsbomb";
import { docsAppearance } from "./docs-appearance";

/** Euro 2024 final — Spain 2–1 England, Berlin, 14 July 2024. */
const EURO_2024_FINAL = 3943043;

interface Chain {
  passes: StatsBombPass[];
  carries: StatsBombCarry[];
  goal: StatsBombShot;
}

/**
 * The possession that produced England's goal, cut off at the goal itself.
 *
 * StatsBomb stamps every event with a `possession` number and the team that
 * owned it, so the move is a filter rather than a reconstruction. Two
 * details do the real work:
 *
 * - A possession does **not** end at the shot — it runs on until the ball
 *   changes hands, so it has to be truncated at the goal itself.
 * - A possession contains the *other* team's events too (pressures, blocks,
 *   an interception that didn't stick), so it's filtered down to the team
 *   that owned it.
 */
function goalChain(events: StatsBombEvent[]): Chain | undefined {
  const goal = shots(events)
    .filter(isGoal)
    .find((shot) => shot.team.name === "England");
  if (!goal) return undefined;

  const possession = events.filter((event) => event.possession === goal.possession);
  const upToGoal = possession.slice(0, possession.indexOf(goal) + 1);
  const attacking = upToGoal.filter((event) => event.team.id === event.possession_team.id);

  return {
    passes: attacking.filter(isPass),
    // A unit or two is a touch adjustment, not progression — and it
    // renders as a speck rather than a trail. (StatsBomb x/y are abstract
    // units on a 120 x 80 grid, not metres.)
    carries: attacking
      .filter(isCarry)
      .filter((carry) => Math.hypot(carry.endX - carry.x, carry.endY - carry.y) > 2),
    goal,
  };
}

/**
 * The quickstart's finished chart: load a real match, isolate the move that
 * produced a goal, and plot it — passes as arrows, carries as comet trails,
 * the goal as a labelled marker.
 */
export function QuickstartChainBasic() {
  const [chain, setChain] = useState<Chain | undefined>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchMatchEvents(EURO_2024_FINAL)
      .then((events) => setChain(goalChain(events)))
      .catch(() => setFailed(true));
  }, []);

  return (
    <div>
      <p className="mb-3 text-xs text-fd-muted-foreground">
        {failed
          ? "Couldn't reach StatsBomb open data."
          : chain === undefined
            ? "Fetching Spain 2–1 England from StatsBomb open data (~3 MB)…"
            : `${chain.passes.length} passes · ${chain.carries.length} ${chain.carries.length === 1 ? "carry" : "carries"} · ${chain.goal.player?.name ?? "Unknown"}, ${chain.goal.minute}'`}
      </p>

      <Pitch type="statsbomb" appearance={docsAppearance}>
        <Comet
          data={chain?.carries ?? []}
          x={(carry) => carry.x}
          y={(carry) => carry.y}
          x2={(carry) => carry.endX}
          y2={(carry) => carry.endY}
          gradient
          endWidth={5}
          tooltip={(carry) => `${carry.player?.name ?? "Unknown"} — carry`}
        />
        <Arrows
          data={chain?.passes ?? []}
          x={(pass) => pass.x}
          y={(pass) => pass.y}
          x2={(pass) => pass.endX}
          y2={(pass) => pass.endY}
          strokeWidth={2}
          strokeOpacity={0.85}
          tooltip={(pass) => `${pass.player?.name ?? "Unknown"} — pass`}
        />
        <Scatter
          data={chain?.passes ?? []}
          x={(pass) => pass.x}
          y={(pass) => pass.y}
          r={3}
          stroke="white"
          strokeWidth={1.5}
          tooltip={(pass) => pass.player?.name ?? "Unknown"}
        />
        <Scatter
          data={chain ? [chain.goal] : []}
          x={(goal) => goal.x}
          y={(goal) => goal.y}
          r={6}
          fill="var(--pitch-marker-goal)"
          stroke="white"
          strokeWidth={2}
          tooltip={(goal) =>
            `${goal.player?.name ?? "Unknown"} — goal, ${goal.shot.statsbomb_xg.toFixed(2)} xG`
          }
        />
        <Annotate
          data={chain ? [chain.goal] : []}
          x={(goal) => goal.x}
          y={(goal) => goal.y}
          label={(goal) => `Goal · ${goal.shot.statsbomb_xg.toFixed(2)} xG`}
          offsetY={-12}
        />
      </Pitch>
    </div>
  );
}
