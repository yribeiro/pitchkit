"use client";

import { useEffect, useState } from "react";
import { Annotate, Arrows, Comet, Pitch, Scatter } from "@pitchkit/react";
import { fetchMatchEvents, isCarry, isPass, isShot } from "@pitchkit/data-providers/statsbomb";
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
  /** The first pass of the move — where the build-up begins. */
  start: StatsBombPass;
  passes: StatsBombPass[];
  carries: StatsBombCarry[];
  shot: StatsBombShot;
}

/**
 * The possession that produced the match's first shot, cut off at the shot.
 *
 * StatsBomb stamps every event with a `possession` number and the team that
 * owned it, so the chain is a filter rather than a reconstruction. Two
 * details do the real work:
 *
 * - A possession does **not** end at the shot — it runs on until the ball
 *   changes hands, so it has to be truncated at the shot itself.
 * - A possession contains the *other* team's events too (pressures, blocks,
 *   an interception that didn't stick), so it's filtered down to the team
 *   that owned it.
 */
function firstShotChain(events: StatsBombEvent[]): Chain | undefined {
  const shot = events.find(isShot);
  if (!shot) return undefined;

  const possession = events.filter((event) => event.possession === shot.possession);
  const upToShot = possession.slice(0, possession.indexOf(shot) + 1);
  const attacking = upToShot.filter((event) => event.team.id === event.possession_team.id);

  const passes = attacking.filter(isPass);
  const start = passes[0];
  if (!start) return undefined;

  return {
    start,
    passes,
    // Carries that stayed still are noise on a pitch, not progression.
    carries: attacking
      .filter(isCarry)
      .filter((carry) => Math.hypot(carry.endX - carry.x, carry.endY - carry.y) > 1),
    shot,
  };
}

/**
 * The quickstart's finished chart: load a real match, isolate the first
 * possession that ends in a shot, and plot it — passes as arrows, carries
 * as comet trails, the shot as a highlighted marker.
 */
export function QuickstartChainBasic() {
  const [chain, setChain] = useState<Chain | undefined>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchMatchEvents(EURO_2024_FINAL)
      .then((events) => setChain(firstShotChain(events)))
      .catch(() => setFailed(true));
  }, []);

  return (
    <div>
      <p className="mb-3 text-xs text-fd-muted-foreground">
        {failed
          ? "Couldn't reach StatsBomb open data."
          : chain === undefined
            ? "Fetching Spain 2–1 England from StatsBomb open data (~3 MB)…"
            : `${chain.passes.length} passes · ${chain.carries.length} carries · ${chain.shot.player?.name ?? "Unknown"}, ${chain.shot.minute}'`}
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
          data={chain ? [chain.shot] : []}
          x={(shot) => shot.x}
          y={(shot) => shot.y}
          r={6}
          fill="var(--pitch-marker-goal)"
          stroke="white"
          strokeWidth={2}
          tooltip={(shot) =>
            `${shot.player?.name ?? "Unknown"} — ${shot.shot.outcome.name}, ${shot.shot.statsbomb_xg.toFixed(2)} xG`
          }
        />
        {/* Labelled at the chain's start, not the shot: the shot sits on the
            byline, where a centred label would run off the edge of the pitch. */}
        <Annotate
          data={chain ? [chain.start] : []}
          x={(event) => event.x}
          y={(event) => event.y}
          label={(event) => `${event.player?.name ?? "Build-up"} starts it`}
          offsetY={-12}
        />
      </Pitch>
    </div>
  );
}
