"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { PitchAppearance } from "@pitchkit/core";
import { Pitch, Polygon, Scatter, Voronoi } from "@pitchkit/react";
import {
  DataProviderError,
  fetchCompetitions,
  fetchMatchEvents,
  fetchMatchThreeSixty,
  fetchMatches,
  isKeeper,
  opponentsIn,
  teammatesIn,
  visibleAreaPolygon,
} from "@pitchkit/data-providers/statsbomb";
import type {
  StatsBombCompetition,
  StatsBombEvent,
  StatsBombMatch,
  StatsBombThreeSixtyFrame,
  StatsBombThreeSixtyPlayer,
} from "@pitchkit/data-providers/statsbomb";
import {
  clockLabel,
  eventLabel,
  matchTeams,
  realTeamOf,
  threeSixtyTimeline,
} from "./statsbomb-360-derive";
import type { FrameEntry } from "./statsbomb-360-derive";

/** World Cup final — every WC2022 match has 360 coverage, and this one is recognisable. */
const DEFAULT_COMPETITION_ID = 43;
const DEFAULT_SEASON_ID = 106;
const DEFAULT_MATCH_ID = 3869685;

const TEAM_COLORS = ["#3b82f6", "#f97316"] as const;

// Playback speed, in timeline entries advanced per second — user-adjustable
// via the fps slider below. 24 (a familiar video frame rate) traverses a
// full match in a couple of minutes; the slider goes from 1 (inspect one
// frame at a time) to 60 (fast overview).
const DEFAULT_FPS = 24;
const MIN_FPS = 1;
const MAX_FPS = 60;

const rowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  alignItems: "center",
  margin: "0 0 0.6rem",
};
const selectStyle: CSSProperties = {
  background: "#111",
  color: "#eee",
  border: "1px solid #444",
  borderRadius: 4,
  padding: "0.3rem 0.4rem",
  fontSize: "0.78rem",
  maxWidth: "22rem",
};
const buttonStyle: CSSProperties = {
  fontSize: "0.8rem",
  color: "#eee",
  background: "#2a2a2a",
  border: "1px solid #444",
  borderRadius: 4,
  padding: "0.4rem 0.9rem",
  cursor: "pointer",
  minWidth: "4.5rem",
};
const labelStyle: CSSProperties = { fontSize: "0.72rem", color: "#888", minWidth: "4.5rem" };
const statusStyle: CSSProperties = {
  fontSize: "0.75rem",
  color: "#bbb",
  margin: "0 0 1rem",
  lineHeight: 1.5,
};
const errorStyle: CSSProperties = {
  ...statusStyle,
  color: "#fca5a5",
  background: "#2a1717",
  border: "1px solid #5b2626",
  borderRadius: 6,
  padding: "0.6rem 0.8rem",
};
const sliderRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  margin: "0.75rem 0",
};
const sliderStyle: CSSProperties = { flex: "1 1 auto" };
const fpsSliderStyle: CSSProperties = { width: "6rem" };
const fpsReadoutStyle: CSSProperties = {
  fontSize: "0.72rem",
  color: "#aaa",
  fontVariantNumeric: "tabular-nums",
  minWidth: "3.5rem",
};
const readoutStyle: CSSProperties = {
  fontSize: "0.78rem",
  color: "#ddd",
  fontVariantNumeric: "tabular-nums",
  minWidth: "16rem",
};
const legendStyle: CSSProperties = {
  display: "flex",
  gap: "1rem",
  fontSize: "0.72rem",
  color: "#aaa",
  margin: "0 0 0.5rem",
};
const swatchStyle = (color: string): CSSProperties => ({
  display: "inline-block",
  width: "0.6rem",
  height: "0.6rem",
  borderRadius: "50%",
  background: color,
  marginRight: "0.3rem",
  verticalAlign: "middle",
});

function describeError(error: unknown): string {
  if (error instanceof DataProviderError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong loading that match.";
}

function competitionKey(competition: StatsBombCompetition): string {
  return `${competition.competition_id}:${competition.season_id}`;
}

function competitionLabel(competition: StatsBombCompetition): string {
  return `${competition.country_name} — ${competition.competition_name} ${competition.season_name}`;
}

function matchLabel(match: StatsBombMatch): string {
  return `${match.match_date}  ${match.home_team.home_team_name} ${match.home_score}–${match.away_score} ${match.away_team.away_team_name}`;
}

interface FrameViewProps {
  entry: FrameEntry;
  teams: readonly [string, string];
  appearance: PitchAppearance;
}

/** One frame: Voronoi control over the tracked players, coloured by real team. */
function FrameView({ entry, teams, appearance }: FrameViewProps) {
  const colorOf = useCallback(
    (player: StatsBombThreeSixtyPlayer) =>
      realTeamOf(player, entry, teams) === teams[0] ? TEAM_COLORS[0] : TEAM_COLORS[1],
    [entry, teams],
  );

  return (
    <Pitch type="statsbomb" appearance={appearance}>
      {/* The broadcast camera's own coverage for this frame — freeze_frame
          only ever lists players inside it. */}
      <Polygon
        data={[entry.frame]}
        points={(frame: StatsBombThreeSixtyFrame) => visibleAreaPolygon(frame)}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
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
        data={opponentsIn(entry.frame)}
        x={(player) => player.x}
        y={(player) => player.y}
        r={(player) => (isKeeper(player) ? 5 : 3.5)}
        fill={colorOf}
        stroke="white"
        strokeWidth={1}
      />
      <Scatter
        data={teammatesIn(entry.frame)}
        x={(player) => player.x}
        y={(player) => player.y}
        r={(player) => (player.actor ? 5.5 : isKeeper(player) ? 5 : 3.5)}
        fill={colorOf}
        stroke={(player) => (player.actor ? "var(--pitch-marker-goal)" : "white")}
        strokeWidth={(player) => (player.actor ? 2.5 : 1)}
        tooltip={(player) =>
          player.actor ? "On the ball" : isKeeper(player) ? "Goalkeeper" : undefined
        }
      />
    </Pitch>
  );
}

interface ThreeSixtyVoronoiDemoProps {
  appearance: PitchAppearance;
}

/**
 * Scrub through a real match with a Voronoi diagram of the tracked players
 * at every 360-covered event — drag the slider, or press Play to watch it
 * advance on its own at an adjustable frames-per-second.
 *
 * Only 12 of StatsBomb's 80 open-data competition-seasons have any 360
 * coverage, and within one, only some matches do — the two pickers below
 * are pre-filtered to `match_available_360`/`match_status_360 === "available"`
 * so every choice on screen actually has data behind it.
 */
export function ThreeSixtyVoronoiDemo({ appearance }: ThreeSixtyVoronoiDemoProps) {
  const [competitions, setCompetitions] = useState<StatsBombCompetition[]>([]);
  const [competition, setCompetition] = useState(`${DEFAULT_COMPETITION_ID}:${DEFAULT_SEASON_ID}`);
  const [matchIndex, setMatchIndex] = useState<
    { readonly key: string; readonly matches: StatsBombMatch[] } | undefined
  >();
  const matchesLoading = matchIndex?.key !== competition;
  const matches = matchIndex?.key === competition ? matchIndex.matches : [];

  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loaded, setLoaded] = useState<
    { readonly events: StatsBombEvent[]; readonly frames: StatsBombThreeSixtyFrame[] } | undefined
  >();

  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(DEFAULT_FPS);

  // Competitions with any 360 coverage at all — the first picker's options.
  useEffect(() => {
    let cancelled = false;
    fetchCompetitions()
      .then((rows) => {
        if (!cancelled) setCompetitions(rows.filter((row) => row.match_available_360));
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describeError(cause));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // That competition's matches, narrowed to ones this specific match has
  // 360 data for (a season having *some* coverage doesn't mean every match
  // in it does).
  useEffect(() => {
    const [competitionId, seasonId] = competition.split(":").map(Number);
    if (competitionId === undefined || seasonId === undefined) return;

    let cancelled = false;
    fetchMatches(competitionId, seasonId)
      .then((rows) => {
        if (cancelled) return;
        const available = rows
          .filter((row) => row.match_status_360 === "available")
          .sort((a, b) => a.match_date.localeCompare(b.match_date));
        setMatchIndex({ key: competition, matches: available });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setMatchIndex({ key: competition, matches: [] });
        setError(describeError(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [competition]);

  const load = useCallback(async (id: number) => {
    setPlaying(false);
    setLoading(true);
    setError(undefined);
    try {
      const [events, frames] = await Promise.all([fetchMatchEvents(id), fetchMatchThreeSixty(id)]);
      setLoaded({ events, frames });
      setPosition(0);
    } catch (cause) {
      setError(describeError(cause));
      setLoaded(undefined);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the default match once its 360 availability is confirmed — no
  // click required for the common "just show me something" case.
  const loadedDefault = useRef(false);
  useEffect(() => {
    if (loadedDefault.current) return;
    loadedDefault.current = true;
    void load(DEFAULT_MATCH_ID);
  }, [load]);

  function selectMatch(id: string) {
    const parsed = Number(id);
    setMatchId(parsed);
    void load(parsed);
  }

  const timeline = useMemo(
    () => (loaded ? threeSixtyTimeline(loaded.events, loaded.frames) : []),
    [loaded],
  );
  const teams = useMemo(
    () => (loaded ? matchTeams(loaded.events) : (["Team A", "Team B"] as const)),
    [loaded],
  );
  const entry = timeline[position];

  // Auto-advance one timeline entry every 1000/fps ms while playing; stop
  // cleanly at the end rather than wrapping, so "Play" always means "watch
  // it out from here". Changing fps mid-playback takes effect immediately —
  // it's a dependency, so the interval is torn down and restarted at the
  // new rate rather than waiting for the current one to finish.
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

  const sortedCompetitions = useMemo(
    () => [...competitions].sort((a, b) => competitionLabel(a).localeCompare(competitionLabel(b))),
    [competitions],
  );

  return (
    <section style={{ marginTop: "2.5rem" }}>
      <h2>@pitchkit/data-providers — 360 tracking, scrubbed</h2>
      <p>
        Every tracked player at one moment, as a Voronoi diagram of space controlled. Drag the
        slider or press Play; <code>fetchMatchThreeSixty(id)</code> plus{" "}
        <code>indexThreeSixtyByEvent</code> do the loading and joining.
      </p>

      <div style={rowStyle}>
        <span style={labelStyle}>Competition</span>
        <select
          style={selectStyle}
          value={competition}
          onChange={(event) => setCompetition(event.target.value)}
          aria-label="Competition and season (360 coverage only)"
          disabled={competitions.length === 0}
        >
          {competitions.length === 0 && <option>Loading…</option>}
          {sortedCompetitions.map((row) => (
            <option key={competitionKey(row)} value={competitionKey(row)}>
              {competitionLabel(row)}
            </option>
          ))}
        </select>
        <span style={{ fontSize: "0.7rem", color: "#666" }}>
          {competitions.length > 0 && `${competitions.length} competition-seasons have 360 data`}
        </span>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Match</span>
        <select
          style={selectStyle}
          value={matchId}
          onChange={(event) => selectMatch(event.target.value)}
          aria-label="Match"
          disabled={matchesLoading || matches.length === 0}
        >
          <option value={DEFAULT_MATCH_ID} disabled hidden={matches.length > 0}>
            {matchesLoading ? "Loading matches…" : `Choose one of ${matches.length} matches…`}
          </option>
          {matches.map((match) => (
            <option key={match.match_id} value={match.match_id}>
              {matchLabel(match)}
              {match.match_id === DEFAULT_MATCH_ID ? " (default)" : ""}
            </option>
          ))}
        </select>
      </div>

      {error !== undefined && <p style={errorStyle}>{error}</p>}
      {loading && (
        <p style={statusStyle}>Fetching events + 360 tracking — the 360 file alone is 5-9 MB.</p>
      )}

      {entry !== undefined && (
        <>
          <div style={legendStyle}>
            <span>
              <span style={swatchStyle(TEAM_COLORS[0])} />
              {teams[0]}
            </span>
            <span>
              <span style={swatchStyle(TEAM_COLORS[1])} />
              {teams[1]}
            </span>
            <span>{timeline.length} tracked events in this match</span>
          </div>

          <div style={sliderRowStyle}>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => setPlaying((was) => !was)}
              disabled={position >= timeline.length - 1 && !playing}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <input
              type="range"
              style={sliderStyle}
              min={0}
              max={timeline.length - 1}
              value={position}
              onChange={(event) => {
                setPlaying(false);
                setPosition(Number(event.target.value));
              }}
              aria-label="Position in match"
            />
            <span style={readoutStyle}>
              {clockLabel(entry)} — {eventLabel(entry)}
            </span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Speed</span>
            <input
              type="range"
              style={fpsSliderStyle}
              min={MIN_FPS}
              max={MAX_FPS}
              value={fps}
              onChange={(event) => setFps(Number(event.target.value))}
              aria-label="Playback speed in frames per second"
            />
            <span style={fpsReadoutStyle}>{fps} fps</span>
            <span style={{ fontSize: "0.68rem", color: "#666" }}>
              Full match at this speed: ~{Math.round(timeline.length / fps)}s
            </span>
          </div>

          <div style={{ width: "100%", maxWidth: 460 }}>
            <FrameView entry={entry} teams={teams} appearance={appearance} />
          </div>
        </>
      )}
    </section>
  );
}
