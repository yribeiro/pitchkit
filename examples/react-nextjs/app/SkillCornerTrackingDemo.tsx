"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { PitchAppearance } from "@pitchkit/core";
import { Pitch, Scatter, Voronoi } from "@pitchkit/react";
import {
  DataProviderError,
  fetchDynamicEvents,
  fetchMatch,
  fetchMatches,
  streamTracking,
} from "@pitchkit/data-providers/skillcorner";
import type {
  SkillCornerEvent,
  SkillCornerFrame,
  SkillCornerMatch,
  SkillCornerMatchSummary,
} from "@pitchkit/data-providers/skillcorner";
import {
  activeEventIndex,
  buildClip,
  clockLabel,
  detectionRate,
  eventsInClip,
  matchLabel,
} from "./skillcorner-derive";
import type { ClipFrame, ClipPlayer } from "./skillcorner-derive";
import { SkillCornerEventCarousel } from "./SkillCornerEventCarousel";

/** Brisbane Roar v Adelaide United — the match the package fixtures were cut from. */
const DEFAULT_MATCH_ID = 1874553;

/**
 * 10 fps tracking, so 400 frames is about 40 seconds of football. Small
 * enough that the stream aborts after a few MB of a 90 MB file, long enough
 * that a phase of play actually plays out.
 */
const CLIP_FRAMES = 400;

const TEAM_COLORS = ["#3b82f6", "#f97316"] as const;
const DEFAULT_FPS = 10; // real time: the data is 10 fps

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
  padding: "0.3rem 0.7rem",
  cursor: "pointer",
};
const noteStyle: CSSProperties = { fontSize: "0.75rem", color: "#999", margin: "0 0 0.6rem" };

/**
 * SkillCorner broadcast tracking, streamed rather than downloaded.
 *
 * The point of the demo is the loading strategy as much as the picture: a
 * match's tracking file is ~90 MB, and `streamTracking` is an async generator,
 * so `break`ing out of the loop once we have a clip aborts the response
 * mid-download. Nothing here waits for 90 MB.
 */
export function SkillCornerTrackingDemo({ appearance }: { appearance: PitchAppearance }) {
  const [matches, setMatches] = useState<SkillCornerMatchSummary[]>([]);
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  const [match, setMatch] = useState<SkillCornerMatch | undefined>();
  const [clip, setClip] = useState<ClipFrame[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(DEFAULT_FPS);
  const [rate, setRate] = useState(0);
  const [clipEvents, setClipEvents] = useState<SkillCornerEvent[]>([]);
  // SkillCorner emits a passing_option per available receiver, so they
  // outnumber everything else roughly two to one and bury the narrative.
  // Off by default, with the count shown so nothing looks hidden.
  const [showPassingOptions, setShowPassingOptions] = useState(false);

  // Lets a new load cancel one already in flight, rather than racing it.
  const abortRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    fetchMatches()
      .then(setMatches)
      .catch(() => setError("Could not reach SkillCorner open data."));
  }, []);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(undefined);
    setClip([]);
    setClipEvents([]);
    setProgress(0);
    setPlaying(false);

    try {
      const loaded = await fetchMatch(matchId, { signal: controller.signal });
      setMatch(loaded);

      // Kicked off before the tracking stream so the ~4 MB CSV downloads
      // alongside it rather than after.
      const eventsPromise = fetchDynamicEvents(loaded, { signal: controller.signal });

      const frames: SkillCornerFrame[] = [];
      for await (const frame of streamTracking(loaded, { signal: controller.signal })) {
        // Skip the pre-kickoff run of empty frames: they carry nulls
        // throughout and an empty player_data, which is the file's own
        // shape rather than anything to draw.
        if (frame.period === null || frame.player_data.length === 0) continue;
        frames.push(frame);
        if (frames.length % 50 === 0) setProgress(frames.length);
        // Leaving the loop here aborts the download — the whole point.
        if (frames.length >= CLIP_FRAMES) break;
      }

      setClip(buildClip(frames, loaded));
      setRate(detectionRate(frames));
      setAt(0);
      setClipEvents(eventsInClip(await eventsPromise, frames));
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(
        cause instanceof DataProviderError
          ? cause.message
          : "Something went wrong loading that match.",
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (!playing || clip.length === 0) return;
    const id = setInterval(() => {
      setAt((current) => {
        if (current + 1 >= clip.length) {
          setPlaying(false);
          return clip.length - 1;
        }
        return current + 1;
      });
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [playing, fps, clip.length]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const current = clip[at];
  const colorOf = (player: ClipPlayer) => (player.isHome ? TEAM_COLORS[0] : TEAM_COLORS[1]);
  const colorOfTeam = (teamId: number | null) =>
    teamId !== null && teamId === match?.home_team.id ? TEAM_COLORS[0] : TEAM_COLORS[1];

  const visibleEvents = showPassingOptions
    ? clipEvents
    : clipEvents.filter((event) => event.event_type !== "passing_option");
  const hiddenCount = clipEvents.length - visibleEvents.length;
  const activeEvent = current ? activeEventIndex(visibleEvents, current.frame.frame) : -1;

  /** Jump the clip to the frame an event starts on. */
  const seekToEvent = (event: SkillCornerEvent) => {
    const index = clip.findIndex((entry) => entry.frame.frame >= event.frame_start);
    if (index !== -1) {
      setPlaying(false);
      setAt(index);
    }
  };

  return (
    <section>
      <h2>SkillCorner — broadcast tracking</h2>

      <p style={noteStyle}>
        Streams a {CLIP_FRAMES}-frame clip (~{Math.round(CLIP_FRAMES / 10)}s at 10 fps) out of a ~90
        MB tracking file, then aborts the download. The dynamic-events strip below tracks the
        playhead — the two files share one frame counter, so an event&apos;s{" "}
        <code>frame_start</code> <em>is</em> a tracking frame number and the alignment is exact
        rather than matched on timestamps. Click any card to jump there. Coordinates go in raw:{" "}
        <code>&lt;Pitch type=&quot;skillcorner&quot;&gt;</code> shares SkillCorner&apos;s
        centre-origin metres, and <code>dimensions</code> draws this stadium&apos;s real{" "}
        {match?.pitch_length ?? 105}&times;{match?.pitch_width ?? 68} m pitch.
      </p>

      <div style={rowStyle}>
        <select
          aria-label="SkillCorner match"
          value={matchId}
          disabled={matches.length === 0 || loading}
          onChange={(event) => {
            setMatchId(Number(event.target.value));
            setClip([]);
          }}
          style={selectStyle}
        >
          {matches.length === 0 && <option value={DEFAULT_MATCH_ID}>Loading matches…</option>}
          {matches.map((summary) => (
            <option key={summary.id} value={summary.id}>
              {matchLabel(summary)}
            </option>
          ))}
        </select>
        <button type="button" style={buttonStyle} disabled={loading} onClick={() => void load()}>
          {loading ? "Streaming…" : clip.length > 0 ? "Reload clip" : "Stream a clip"}
        </button>
      </div>

      {error !== undefined && <p style={{ ...noteStyle, color: "#f87171" }}>{error}</p>}

      {loading && progress > 0 && <p style={noteStyle}>{progress} frames so far…</p>}

      {current && match && (
        <>
          <div style={rowStyle}>
            <button type="button" style={buttonStyle} onClick={() => setPlaying((was) => !was)}>
              {playing ? "Pause" : "Play"}
            </button>
            <input
              type="range"
              aria-label="Position in clip"
              min={0}
              max={clip.length - 1}
              value={at}
              onChange={(event) => {
                setPlaying(false);
                setAt(Number(event.target.value));
              }}
              style={{ flex: 1, minWidth: "12rem" }}
            />
            <span
              style={{ fontSize: "0.75rem", color: "#999", fontVariantNumeric: "tabular-nums" }}
            >
              {clockLabel(current.frame)} · frame {current.frame.frame}
            </span>
          </div>

          <div style={rowStyle}>
            <span style={{ fontSize: "0.75rem", color: "#999" }}>Speed</span>
            <input
              type="range"
              aria-label="Playback speed"
              min={1}
              max={30}
              value={fps}
              onChange={(event) => setFps(Number(event.target.value))}
              style={{ width: "8rem" }}
            />
            <span style={{ fontSize: "0.75rem", color: "#999" }}>
              {fps} fps {fps === 10 ? "(real time)" : ""}
            </span>
          </div>

          <p style={noteStyle}>
            {match.home_team.short_name} v {match.away_team.short_name} · pitch {match.pitch_length}
            &times;{match.pitch_width} m · {Math.round(rate * 100)}% of positions genuinely
            detected, the rest extrapolated between sightings (faded markers).
          </p>

          <div style={rowStyle}>
            <span style={{ fontSize: "0.75rem", color: "#999" }}>
              Dynamic events ({visibleEvents.length})
            </span>
            <label style={{ fontSize: "0.75rem", color: "#999", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showPassingOptions}
                onChange={(event) => setShowPassingOptions(event.target.checked)}
                style={{ marginRight: "0.3rem" }}
              />
              show passing options{hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ""}
            </label>
          </div>

          <SkillCornerEventCarousel
            events={visibleEvents}
            activeIndex={activeEvent}
            colorOfTeam={colorOfTeam}
            onSelect={seekToEvent}
          />

          <Pitch
            type="skillcorner"
            dimensions={{ length: match.pitch_length, width: match.pitch_width }}
            appearance={appearance}
          >
            <Voronoi
              data={current.players}
              x={(player) => player.x}
              y={(player) => player.y}
              fill={colorOf}
              fillOpacity={0.13}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={0.4}
            />
            <Scatter
              data={current.players}
              x={(player) => player.x}
              y={(player) => player.y}
              r={2.4}
              // Faded when the position was extrapolated rather than seen —
              // SkillCorner's own is_detected flag, surfaced rather than
              // hidden. Faded rather than hollow because at a wide camera
              // angle most of a frame is extrapolated, and a pitch of empty
              // rings stops reading as players at all.
              fill={colorOf}
              fillOpacity={(player) => (player.is_detected ? 1 : 0.25)}
              stroke={colorOf}
              strokeWidth={0.7}
              tooltip={(player) =>
                `${player.player?.short_name ?? `#${player.player_id}`}${
                  player.is_detected ? "" : " (extrapolated)"
                }`
              }
            />
            {current.frame.ball_data.x !== null && current.frame.ball_data.y !== null && (
              <Scatter
                data={[current.frame]}
                x={(frame) => frame.ball_data.x ?? 0}
                y={(frame) => frame.ball_data.y ?? 0}
                r={1.4}
                fill="#fff"
                stroke="#111"
                strokeWidth={0.4}
                tooltip={() => "Ball"}
              />
            )}
          </Pitch>
        </>
      )}
    </section>
  );
}
