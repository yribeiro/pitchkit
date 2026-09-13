"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Pitch, Scatter, Voronoi } from "@pitchkit/react";
import { fetchMatch, fetchMatches, streamTracking } from "@pitchkit/data-providers/skillcorner";
import type {
  SkillCornerFrame,
  SkillCornerMatch,
  SkillCornerMatchSummary,
} from "@pitchkit/data-providers/skillcorner";
import { docsAppearance } from "./docs-appearance";
import { DEFAULT_MATCH_ID, matchLabel, selectClass } from "./skillcorner-live";

/** 10 fps is the data's own rate, so this plays back in real time. */
const FPS = 10;
/** 30 seconds of football — enough for a phase of play, ~2 MB of a 90 MB file. */
const CLIP_FRAMES = 300;

const TEAM_COLORS = ["var(--pitch-marker-primary)", "var(--pitch-marker-goal)"] as const;

interface Clip {
  readonly match: SkillCornerMatch;
  readonly frames: readonly SkillCornerFrame[];
  /** player_id → true when that player is on the home team. */
  readonly isHome: ReadonlyMap<number, boolean>;
}

/**
 * Stream a clip out of a match's tracking file.
 *
 * A full file is ~90 MB at 10 fps. `streamTracking` is an async generator, so
 * leaving the loop closes the reader and **aborts the download** — this pulls
 * roughly 2 MB and stops. That is the whole trick, and it's why tracking data
 * is usable in a browser at all.
 */
async function streamClip(matchId: number, signal: AbortSignal): Promise<Clip> {
  const match = await fetchMatch(matchId, { signal });
  const frames: SkillCornerFrame[] = [];

  for await (const frame of streamTracking(match, { signal })) {
    // Before kickoff every field is null and `player_data` is empty — the
    // file's own shape, not a parse failure.
    if (frame.period === null || frame.player_data.length === 0) continue;
    frames.push(frame);
    if (frames.length >= CLIP_FRAMES) break; // ← stops the download
  }

  // Tracking carries only `player_id` — no name, no team — so the match file
  // is what turns a position into a side. The join key is `players[].id`,
  // **not** `trackable_object`, which is a different id space entirely.
  const isHome = new Map(
    match.players.map((player) => [player.id, player.team_id === match.home_team.id]),
  );

  return { match, frames, isHome };
}

/** Loads a clip whenever the chosen match changes, and cancels the last one. */
function useClip(matchId: number) {
  const [clip, setClip] = useState<{ key: number; value: Clip } | undefined>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    streamClip(matchId, controller.signal)
      .then((value) => setClip({ key: matchId, value }))
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [matchId]);

  return { clip: clip?.key === matchId ? clip.value : undefined, failed };
}

/** Advances a frame index at a fixed rate, looping at the end. */
function usePlayhead(length: number) {
  const [at, setAt] = useState(0);

  useEffect(() => {
    if (length === 0) return;
    const id = setInterval(() => setAt((current) => (current + 1) % length), 1000 / FPS);
    return () => clearInterval(id);
  }, [length]);

  return Math.min(at, Math.max(length - 1, 0));
}

/** Match picker and status line — the chrome, kept out of the way. */
function MatchPicker({
  value,
  onChange,
  status,
}: {
  value: number;
  onChange: (id: number) => void;
  status: ReactNode;
}) {
  const [matches, setMatches] = useState<SkillCornerMatchSummary[]>([]);

  useEffect(() => {
    fetchMatches()
      .then(setMatches)
      .catch(() => undefined);
  }, []);

  return (
    <>
      <select
        aria-label="SkillCorner match"
        value={value}
        disabled={matches.length === 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className={selectClass}
      >
        {matches.length === 0 && <option value={DEFAULT_MATCH_ID}>Loading matches…</option>}
        {matches.map((match) => (
          <option key={match.id} value={match.id}>
            {matchLabel(match)}
          </option>
        ))}
      </select>
      <p className="my-3 text-xs text-fd-muted-foreground">{status}</p>
    </>
  );
}

/**
 * A streamed clip of SkillCorner broadcast tracking, playing at 10 fps.
 *
 * Coordinates go in **raw**: `<Pitch type="skillcorner">` uses SkillCorner's
 * own centre-origin metres, so the accessors are just `(p) => p.x`. The
 * `dimensions` prop draws this stadium's real pitch — they run 104 to 106 m.
 */
export function SkillcornerTrackingBasic() {
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  const { clip, failed } = useClip(matchId);
  const at = usePlayhead(clip?.frames.length ?? 0);
  const frame = clip?.frames[at];

  const fill = (player: { player_id: number }) =>
    clip?.isHome.get(player.player_id) ? TEAM_COLORS[0] : TEAM_COLORS[1];

  return (
    <div>
      <MatchPicker
        value={matchId}
        onChange={setMatchId}
        status={
          failed
            ? "Couldn't reach SkillCorner open data."
            : clip === undefined
              ? `Streaming ${CLIP_FRAMES} frames out of a ~90 MB tracking file…`
              : `${clip.frames.length} frames · ${clip.match.pitch_length}×${clip.match.pitch_width} m pitch · playing at ${FPS} fps`
        }
      />

      <Pitch
        type="skillcorner"
        dimensions={clip && { length: clip.match.pitch_length, width: clip.match.pitch_width }}
        appearance={docsAppearance}
      >
        {frame && (
          <>
            <Voronoi
              data={frame.player_data}
              x={(player) => player.x}
              y={(player) => player.y}
              fill={fill}
              fillOpacity={0.13}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={0.4}
            />
            <Scatter
              data={frame.player_data}
              x={(player) => player.x}
              y={(player) => player.y}
              r={2.4}
              fill={fill}
              // Broadcast tracking only sees what the camera framed; the rest
              // is extrapolated between sightings, and `is_detected` says which.
              fillOpacity={(player) => (player.is_detected ? 1 : 0.25)}
              stroke={fill}
              strokeWidth={0.7}
            />
            {frame.ball_data.x !== null && frame.ball_data.y !== null && (
              <Scatter
                data={[frame.ball_data]}
                x={(ball) => ball.x ?? 0}
                y={(ball) => ball.y ?? 0}
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
