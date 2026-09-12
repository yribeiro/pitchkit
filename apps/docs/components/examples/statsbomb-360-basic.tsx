"use client";

import { useState } from "react";
import { Polygon, Scatter, VerticalPitch, Voronoi } from "@pitchkit/react";
import {
  fetchMatchEvents,
  fetchMatchThreeSixty,
  indexThreeSixtyByEvent,
  isKeeper,
  visibleAreaPolygon,
} from "@pitchkit/data-providers/statsbomb";
import type {
  StatsBombEvent,
  StatsBombThreeSixtyFrame,
  StatsBombThreeSixtyPlayer,
} from "@pitchkit/data-providers/statsbomb";
import { docsAppearance } from "./docs-appearance";
import { DEFAULT_MATCH_ID, controlClass, matchLabel, useEuroMatches } from "./statsbomb-live";

const TEAM_COLORS = ["var(--pitch-marker-primary)", "var(--pitch-marker-goal)"] as const;

interface Moment {
  event: StatsBombEvent;
  frame: StatsBombThreeSixtyFrame;
}

/** Every Euro 2024 fixture, in kickoff order. */
function MatchSelector({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (matchId: number) => void;
}) {
  const matches = useEuroMatches();

  return (
    <select
      aria-label="Euro 2024 match"
      value={value}
      disabled={disabled ?? matches.length === 0}
      onChange={(event) => onChange(Number(event.target.value))}
      className={`w-full min-w-0 sm:w-auto sm:max-w-xs ${controlClass}`}
    >
      {matches.length === 0 && <option value={DEFAULT_MATCH_ID}>Loading matches…</option>}
      {matches.map((match) => (
        <option key={match.match_id} value={match.match_id}>
          {matchLabel(match)}
        </option>
      ))}
    </select>
  );
}

/**
 * The two files joined into one list: every event that has both a location
 * and a 360 frame, in StatsBomb's own play order (`index`).
 */
function join(
  events: readonly StatsBombEvent[],
  frames: readonly StatsBombThreeSixtyFrame[],
): Moment[] {
  const frameByEvent = indexThreeSixtyByEvent(frames);
  const moments: Moment[] = [];
  for (const event of events) {
    if (typeof event.x !== "number") continue;
    const frame = frameByEvent.get(event.id);
    if (frame) moments.push({ event, frame });
  }
  return moments.sort((a, b) => a.event.index - b.event.index);
}

/**
 * `teammate` is relative to whoever performed the current event, so left
 * alone the colours would swap sides on every change of possession.
 * Resolving it to the match's real team names keeps a colour meaning one
 * team throughout.
 */
function colorOf(player: StatsBombThreeSixtyPlayer, moment: Moment, teams: string[]): string {
  const team = player.teammate
    ? moment.event.team.name
    : teams.find((name) => name !== moment.event.team.name);
  return team === teams[0] ? TEAM_COLORS[0] : TEAM_COLORS[1];
}

function clockLabel(event: StatsBombEvent): string {
  const { minute } = event;
  if (minute < 45) return `${minute}'`;
  if (minute < 90) return minute === 45 ? "45'" : `45+${minute - 45}'`;
  return minute === 90 ? "90'" : `90+${minute - 90}'`;
}

/** One tracked moment: who was where, and the space each player was closest to. */
function MomentPitch({ moment, teams }: { moment: Moment; teams: string[] }) {
  const fill = (player: StatsBombThreeSixtyPlayer) => colorOf(player, moment, teams);

  return (
    <figure className="m-0">
      <VerticalPitch type="statsbomb" appearance={docsAppearance}>
        <Polygon
          data={[moment.frame]}
          points={(frame: StatsBombThreeSixtyFrame) => visibleAreaPolygon(frame)}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
        <Voronoi
          data={moment.frame.freeze_frame}
          x={(player) => player.x}
          y={(player) => player.y}
          fill={fill}
          fillOpacity={0.14}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={0.5}
        />
        <Scatter
          data={moment.frame.freeze_frame}
          x={(player) => player.x}
          y={(player) => player.y}
          r={(player) => (player.actor ? 5.5 : isKeeper(player) ? 5 : 3.5)}
          fill={fill}
          stroke={(player) => (player.actor ? "white" : "rgba(255,255,255,0.7)")}
          strokeWidth={(player) => (player.actor ? 2.5 : 1)}
          tooltip={(player) =>
            player.actor ? "On the ball" : isKeeper(player) ? "Goalkeeper" : undefined
          }
        />
      </VerticalPitch>
      <figcaption className="mt-1 text-xs tabular-nums text-fd-muted-foreground">
        {clockLabel(moment.event)} · {moment.event.type.name} · {moment.event.team.name}
      </figcaption>
    </figure>
  );
}

/**
 * Two consecutive tracked moments, side by side — step through the match a
 * pair at a time.
 *
 * Unlike the events example this waits for a click: the 360 file is around
 * 7 MB, which isn't something to pull on every page view.
 */
export function Statsbomb360Basic() {
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  const [status, setStatus] = useState<"idle" | "loading" | "failed">("idle");
  const [moments, setMoments] = useState<Moment[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [at, setAt] = useState(0);

  async function load() {
    setStatus("loading");
    const [events, frames] = await Promise.all([
      fetchMatchEvents(matchId),
      fetchMatchThreeSixty(matchId),
    ]);
    setMoments(join(events, frames));
    setTeams([...new Set(events.map((event) => event.team.name))]);
    setAt(0);
    setStatus("idle");
  }

  const pair = moments.slice(at, at + 2);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <MatchSelector
          value={matchId}
          disabled={status === "loading"}
          onChange={(next) => {
            setMatchId(next);
            setMoments([]);
            setStatus("idle");
          }}
        />
        <button
          type="button"
          disabled={status === "loading"}
          onClick={() => {
            load().catch(() => setStatus("failed"));
          }}
          className={`font-medium hover:bg-fd-accent ${controlClass}`}
        >
          {status === "loading" ? "Loading…" : moments.length > 0 ? "Reload" : "Load tracking data"}
        </button>
      </div>

      <p className="my-3 text-xs text-fd-muted-foreground">
        {status === "failed"
          ? "Couldn't reach StatsBomb open data."
          : status === "loading"
            ? "Fetching events + 360 tracking (~10 MB together)…"
            : moments.length === 0
              ? "360 files are around 7 MB, so this one waits for a click rather than loading with the page."
              : `${moments.length} tracked moments · showing ${at + 1}–${at + pair.length}`}
      </p>

      {pair.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {pair.map((moment) => (
              <MomentPitch key={moment.event.id} moment={moment} teams={teams} />
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className={`font-medium hover:bg-fd-accent ${controlClass}`}
              disabled={at === 0}
              onClick={() => setAt((current) => Math.max(0, current - 2))}
            >
              ← Previous
            </button>
            <button
              type="button"
              className={`font-medium hover:bg-fd-accent ${controlClass}`}
              disabled={at + 2 >= moments.length}
              onClick={() => setAt((current) => Math.min(moments.length - 1, current + 2))}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
