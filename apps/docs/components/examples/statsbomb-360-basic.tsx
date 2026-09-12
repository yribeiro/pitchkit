"use client";

import { useEffect, useState } from "react";
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

/** Every Euro 2024 fixture, in kickoff order, over a line of status text. */
function MatchSelector({
  value,
  onChange,
  status,
}: {
  value: number;
  onChange: (matchId: number) => void;
  status: string;
}) {
  const matches = useEuroMatches();

  return (
    <>
      <select
        aria-label="Euro 2024 match"
        value={value}
        disabled={matches.length === 0}
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
      <p className="my-3 text-xs text-fd-muted-foreground">{status}</p>
    </>
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
 * Both files are fetched together, so picking a match pulls around 10 MB.
 */
export function Statsbomb360Basic() {
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  // Keyed by the match it belongs to, so "still loading" is derived rather
  // than a second state field.
  const [result, setResult] = useState<
    { key: number; moments: Moment[]; teams: string[] } | undefined
  >();
  const [failed, setFailed] = useState(false);
  const [at, setAt] = useState(0);

  const loaded = result?.key === matchId ? result : undefined;

  useEffect(() => {
    Promise.all([fetchMatchEvents(matchId), fetchMatchThreeSixty(matchId)])
      .then(([events, frames]) =>
        setResult({
          key: matchId,
          moments: join(events, frames),
          teams: [...new Set(events.map((event) => event.team.name))],
        }),
      )
      .catch(() => setFailed(true));
  }, [matchId]);

  const moments = loaded?.moments ?? [];
  const pair = moments.slice(at, at + 2);

  return (
    <div>
      <MatchSelector
        value={matchId}
        onChange={(next) => {
          setFailed(false);
          setAt(0);
          setMatchId(next);
        }}
        status={
          failed
            ? "Couldn't reach StatsBomb open data."
            : loaded === undefined
              ? "Fetching events + 360 tracking from StatsBomb open data (~10 MB)…"
              : `${moments.length} tracked moments · showing ${at + 1}–${at + pair.length}`
        }
      />

      {pair.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {pair.map((moment) => (
              <MomentPitch key={moment.event.id} moment={moment} teams={loaded?.teams ?? []} />
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
