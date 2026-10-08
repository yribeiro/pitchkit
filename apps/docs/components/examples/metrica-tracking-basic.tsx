"use client";

import { useEffect, useState } from "react";
import { Pitch, Scatter, Voronoi } from "@pitchkit/react";
import {
  fetchEvents,
  fetchTrackingWindow,
  isGoal,
  isOwnGoal,
  shots,
} from "@pitchkit/data-providers/metrica";
import type { MetricaEvent, MetricaFrame } from "@pitchkit/data-providers/metrica";
import { docsAppearance } from "./docs-appearance";

/** Metrica track at 25 fps, so this plays back in real time. */
const FPS = 25;
/** Five seconds of build-up before the goal, and one after it goes in. */
const BEFORE = 5 * FPS;
const AFTER = FPS;

const selectClass =
  "w-full min-w-0 rounded-md border border-fd-border bg-fd-card py-1.5 pl-2 pr-8 text-sm disabled:opacity-50 sm:w-auto sm:max-w-xs";

/**
 * Every goal in a game, own goals included. Metrica record an own goal as a
 * `BALL OUT` by the player who put it in, so `shots(...).filter(isGoal)` alone
 * would miss Sample Game 1's only away goal.
 */
async function loadGoals(game: number, signal: AbortSignal): Promise<MetricaEvent[]> {
  const events = await fetchEvents(game, { signal });
  return [...shots(events).filter(isGoal), ...events.filter(isOwnGoal)].sort(
    (a, b) => a["Start Frame"] - b["Start Frame"],
  );
}

/**
 * The frames around one goal. Events and tracking share a clock, so the
 * goal's own `Start Frame` is the window's anchor. `fetchTrackingWindow`
 * reads only those rows from each team's 32 MB file, with `Range` requests.
 */
async function loadClip(game: number, goal: MetricaEvent, signal: AbortSignal) {
  return fetchTrackingWindow(game, {
    fromFrame: goal["Start Frame"] - BEFORE,
    toFrame: goal["End Frame"] + AFTER,
    signal,
  });
}

function goalLabel(goal: MetricaEvent): string {
  const seconds = Math.floor(goal["Start Time [s]"]);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  // An own goal's Team is the side that conceded it.
  return isOwnGoal(goal)
    ? `${clock} · ${goal.Team} own goal (${goal.From})`
    : `${clock} · ${goal.Team} goal (${goal.From})`;
}

/** Advances a frame index at the data's own rate, looping at the end. */
function usePlayhead(length: number) {
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (length === 0) return;
    const id = setInterval(() => setAt((current) => (current + 1) % length), 1000 / FPS);
    return () => clearInterval(id);
  }, [length]);
  return Math.min(at, Math.max(length - 1, 0));
}

/**
 * Every goal in Metrica's two sample games, replayed from the tracking data
 * at 25 fps: each team's players, the ball, and the scorer ringed in white.
 *
 * Coordinates go in **raw**. `<Pitch type="metrica">` is Metrica's own `0..1`
 * grid, origin top-left with y downward, so the accessors are just `(p) => p.x`.
 */
export function MetricaTrackingBasic() {
  const [game, setGame] = useState(1);
  const [loaded, setLoaded] = useState<{ game: number; goals: MetricaEvent[] }>();
  const [goalIndex, setGoalIndex] = useState(0);
  const [clip, setClip] = useState<{ goal: MetricaEvent; frames: MetricaFrame[] }>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadGoals(game, controller.signal)
      .then((goals) => setLoaded({ game, goals }))
      .catch(() => !controller.signal.aborted && setFailed(true));
    return () => controller.abort();
  }, [game]);

  const goals = loaded?.game === game ? loaded.goals : [];
  const goal = goals[goalIndex];
  useEffect(() => {
    if (!goal) return;
    const controller = new AbortController();
    loadClip(game, goal, controller.signal)
      .then((frames) => setClip({ goal, frames }))
      .catch(() => !controller.signal.aborted && setFailed(true));
    return () => controller.abort();
  }, [game, goal]);

  const frames = clip && clip.goal === goal ? clip.frames : [];
  const frame = frames[usePlayhead(frames.length)];
  const fill = (p: { team: string }) =>
    p.team === "Home" ? "var(--pitch-marker-primary)" : "var(--pitch-marker-goal)";

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          aria-label="Metrica sample game"
          value={game}
          onChange={(event) => {
            setGame(Number(event.target.value));
            setGoalIndex(0);
          }}
          className={selectClass}
        >
          <option value={1}>Sample Game 1</option>
          <option value={2}>Sample Game 2</option>
        </select>
        <select
          aria-label="Goal"
          value={goalIndex}
          disabled={goals.length === 0}
          onChange={(event) => setGoalIndex(Number(event.target.value))}
          className={selectClass}
        >
          {goals.length === 0 && <option>Loading events…</option>}
          {goals.map((g, i) => (
            <option key={g["Start Frame"]} value={i}>
              {goalLabel(g)}
            </option>
          ))}
        </select>
      </div>
      <p className="my-3 text-xs text-fd-muted-foreground">
        {failed
          ? "Couldn't reach Metrica's sample data."
          : frame
            ? `${frames.length} frames · 105×68 m pitch · playing at ${FPS} fps`
            : "Reading the frames around the goal…"}
      </p>

      <Pitch type="metrica" appearance={docsAppearance}>
        {frame && (
          <>
            <Voronoi
              data={frame.players}
              x={(p) => p.x}
              y={(p) => p.y}
              fill={fill}
              fillOpacity={0.13}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={0.4}
            />
            <Scatter
              data={frame.players}
              x={(p) => p.x}
              y={(p) => p.y}
              // The event's `From` is the tracking column's own spelling, so
              // this is how the scorer is picked out.
              r={(p) => (p.player === goal?.From ? 3.6 : 2.4)}
              fill={fill}
              stroke={(p) => (p.player === goal?.From ? "#fff" : fill(p))}
              strokeWidth={(p) => (p.player === goal?.From ? 1.2 : 0.7)}
              tooltip={(p) => `${p.team} #${p.jersey ?? "?"}`}
            />
            {/* Untracked in about 40% of frames, mostly while play is stopped. */}
            {frame.ball && (
              <Scatter
                data={[frame.ball]}
                x={(b) => b.x}
                y={(b) => b.y}
                r={1.4}
                fill="#fff"
                stroke="#111"
                strokeWidth={0.4}
              />
            )}
          </>
        )}
      </Pitch>
    </div>
  );
}
