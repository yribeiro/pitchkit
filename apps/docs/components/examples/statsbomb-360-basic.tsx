"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pitch, Polygon, Scatter, Voronoi } from "@pitchkit/react";
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
import {
  DEFAULT_MATCH_ID,
  ExampleButton,
  ExampleControls,
  ExampleError,
  ExampleLabel,
  ExampleSelect,
  ExampleStatus,
  describeError,
  matchLabel,
  useEuroMatches,
} from "./statsbomb-live";

const TEAM_COLORS = ["var(--pitch-marker-primary)", "var(--pitch-marker-goal)"] as const;
const DEFAULT_FPS = 24;

interface FrameEntry {
  event: StatsBombEvent;
  frame: StatsBombThreeSixtyFrame;
}

/**
 * The two files joined into one scrubbable timeline: every event that has
 * both a location and a 360 frame, in StatsBomb's own play order (`index`),
 * so dragging left-to-right really is kickoff-to-full-time.
 */
function buildTimeline(
  events: readonly StatsBombEvent[],
  frames: readonly StatsBombThreeSixtyFrame[],
): FrameEntry[] {
  const frameByEvent = indexThreeSixtyByEvent(frames);
  const entries: FrameEntry[] = [];
  for (const event of events) {
    if (typeof event.x !== "number") continue;
    const frame = frameByEvent.get(event.id);
    if (frame) entries.push({ event, frame });
  }
  return entries.sort((a, b) => a.event.index - b.event.index);
}

/**
 * `teammate` is relative to whoever performed the current event, so left
 * alone the colours would swap sides on every change of possession.
 * Resolving it to the match's real team names keeps a colour meaning one
 * team for the whole timeline.
 */
function realTeamOf(player: StatsBombThreeSixtyPlayer, entry: FrameEntry, teams: string[]): string {
  const eventTeam = entry.event.team.name;
  if (player.teammate) return eventTeam;
  return teams[0] === eventTeam ? (teams[1] ?? eventTeam) : (teams[0] ?? eventTeam);
}

function clockLabel(entry: FrameEntry): string {
  const { minute } = entry.event;
  if (minute < 45) return `${minute}'`;
  if (minute < 90) return minute === 45 ? "45'" : `45+${minute - 45}'`;
  return minute === 90 ? "90'" : `90+${minute - 90}'`;
}

/**
 * Scrub a real match's 360 tracking data, one Voronoi diagram of space
 * controlled per tracked event.
 *
 * Unlike the events example this waits for a click: the 360 file is around
 * 7 MB, which isn't something to pull on every page view.
 */
export function Statsbomb360Basic() {
  const { matches, error: matchesError } = useEuroMatches();
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loaded, setLoaded] = useState<
    { events: StatsBombEvent[]; frames: StatsBombThreeSixtyFrame[] } | undefined
  >();
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(DEFAULT_FPS);

  const load = useCallback(async () => {
    setPlaying(false);
    setLoading(true);
    setError(undefined);
    try {
      const [events, frames] = await Promise.all([
        fetchMatchEvents(matchId),
        fetchMatchThreeSixty(matchId),
      ]);
      setLoaded({ events, frames });
      setPosition(0);
    } catch (cause) {
      setError(describeError(cause));
      setLoaded(undefined);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  const timeline = useMemo(
    () => (loaded ? buildTimeline(loaded.events, loaded.frames) : []),
    [loaded],
  );
  const teams = useMemo(
    () => (loaded ? [...new Set(loaded.events.map((event) => event.team.name))] : []),
    [loaded],
  );
  const entry = timeline[position];

  useEffect(() => {
    if (!playing || timeline.length === 0) return;
    const id = setInterval(() => {
      setPosition((current) => {
        const next = current + 1;
        if (next >= timeline.length - 1) {
          setPlaying(false);
          return timeline.length - 1;
        }
        return next;
      });
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [playing, fps, timeline.length]);

  const colorOf = (player: StatsBombThreeSixtyPlayer) =>
    entry && realTeamOf(player, entry, teams) === teams[0] ? TEAM_COLORS[0] : TEAM_COLORS[1];

  return (
    <div>
      <ExampleControls>
        <ExampleLabel>Match</ExampleLabel>
        <ExampleSelect
          label="Euro 2024 match"
          value={matchId}
          disabled={matches.length === 0 || loading}
          onChange={(value) => {
            setMatchId(Number(value));
            setLoaded(undefined);
            setPlaying(false);
          }}
        >
          {matches.length === 0 && <option value={DEFAULT_MATCH_ID}>Loading matches…</option>}
          {matches.map((match) => (
            <option key={match.match_id} value={match.match_id}>
              {matchLabel(match)}
            </option>
          ))}
        </ExampleSelect>
        <ExampleButton onClick={() => void load()} disabled={loading}>
          {loading ? "Loading…" : loaded ? "Reload" : "Load tracking data"}
        </ExampleButton>
      </ExampleControls>

      {(error ?? matchesError) !== undefined && (
        <ExampleError>{error ?? matchesError}</ExampleError>
      )}

      {loading && <ExampleStatus>Fetching events + 360 tracking (~10 MB together)…</ExampleStatus>}

      {!loading && loaded === undefined && error === undefined && (
        <ExampleStatus>
          360 files are around 7 MB, so this one waits for a click rather than loading with the
          page.
        </ExampleStatus>
      )}

      {entry !== undefined && (
        <>
          <ExampleControls>
            <ExampleButton onClick={() => setPlaying((was) => !was)}>
              {playing ? "Pause" : "Play"}
            </ExampleButton>
            <input
              type="range"
              aria-label="Position in match"
              min={0}
              max={timeline.length - 1}
              value={position}
              onChange={(event) => {
                setPlaying(false);
                setPosition(Number(event.target.value));
              }}
              className="w-full flex-1 sm:w-auto"
            />
            <span className="text-xs tabular-nums text-fd-muted-foreground">
              {clockLabel(entry)} · {entry.event.type.name} · {entry.event.team.name}
            </span>
          </ExampleControls>

          <ExampleControls>
            <ExampleLabel>Speed</ExampleLabel>
            <input
              type="range"
              aria-label="Playback speed in frames per second"
              min={1}
              max={60}
              value={fps}
              onChange={(event) => setFps(Number(event.target.value))}
              className="w-full sm:w-32"
            />
            <span className="text-xs tabular-nums text-fd-muted-foreground">{fps} fps</span>
          </ExampleControls>
        </>
      )}

      <Pitch type="statsbomb" appearance={docsAppearance}>
        {entry !== undefined && (
          <>
            <Polygon
              data={[entry.frame]}
              points={(frame: StatsBombThreeSixtyFrame) => visibleAreaPolygon(frame)}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
            />
            <Voronoi
              data={entry.frame.freeze_frame}
              x={(player) => player.x}
              y={(player) => player.y}
              fill={colorOf}
              fillOpacity={0.14}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={0.5}
            />
            <Scatter
              data={entry.frame.freeze_frame}
              x={(player) => player.x}
              y={(player) => player.y}
              r={(player) => (player.actor ? 5.5 : isKeeper(player) ? 5 : 3.5)}
              fill={colorOf}
              stroke={(player) => (player.actor ? "white" : "rgba(255,255,255,0.7)")}
              strokeWidth={(player) => (player.actor ? 2.5 : 1)}
              tooltip={(player) =>
                player.actor ? "On the ball" : isKeeper(player) ? "Goalkeeper" : undefined
              }
            />
          </>
        )}
      </Pitch>
    </div>
  );
}
