/**
 * Reel 02 — broadcast tracking of a real goal, played back through
 * `<Pitch type="skillcorner">` with a live `<Voronoi>` of who controls which
 * space. SkillCorner open data (A-League 2024/25), 10 fps, interpolated to 30.
 */
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { Comet, Pitch, Scatter, Voronoi } from "@pitchkit/react";
import { Upright } from "../charts";
import { Backdrop, Eyebrow, PitchStage, Tag } from "../components/Chrome";
import { EndCard } from "../components/EndCard";
import { Lockup } from "../components/Logo";
import { trackingClip } from "../data";
import type { TrackedPlayer } from "../data";
import { appearance, C, FONT, PAD } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clip = trackingClip;
const frames = clip.frames;
const shotIndex = Math.max(
  0,
  frames.findIndex((f) => f.frame >= clip.shotFrame),
);

/** Turn the pitch so the scoring attack runs *up* the screen. */
const ballAtShot = frames[shotIndex]?.ball;
const turn: -90 | 90 = ballAtShot && ballAtShot[0] < 0 ? 90 : -90;

// Timeline, in video frames (30 fps) → tracking index (10 fps).
const START = Math.max(0, shotIndex - 110); // 11 s of build-up
const SLOW_FROM = shotIndex - 22; // the last 2.2 s before the shot at 0.4x
const SLOW = 0.4;
const INTRO = 45;
const A = (SLOW_FROM - START) * 3; // real-time part
const B = Math.round(((shotIndex - SLOW_FROM) * 3) / SLOW); // slow-motion part
const C_ = Math.min(frames.length - 1 - shotIndex, 20) * 3; // after the shot
const HOLD = 45;
export const TRACKING_DURATION = INTRO + A + B + C_ + HOLD + 90;

function trackingIndex(videoFrame: number): number {
  const f = Math.max(0, videoFrame - INTRO);
  if (f < A) return START + f / 3;
  if (f < A + B) return SLOW_FROM + ((f - A) / 3) * SLOW;
  if (f < A + B + C_) return shotIndex + (f - A - B) / 3;
  return shotIndex + C_ / 3;
}

interface Dot {
  x: number;
  y: number;
  home: boolean;
  detected: boolean;
}

/**
 * Players at a fractional index. Tracking has no stable per-player order
 * guarantee across frames in this trimmed snapshot, so interpolate by
 * nearest same-team neighbour rather than by array position.
 */
function playersAt(t: number): Dot[] {
  const i = Math.floor(t);
  const a = frames[Math.min(i, frames.length - 1)];
  const b = frames[Math.min(i + 1, frames.length - 1)];
  if (!a || !b) return [];
  const k = t - i;
  const toDot = ([x, y, home, detected]: TrackedPlayer): Dot => ({
    x,
    y,
    home: home === 1,
    detected: detected === 1,
  });
  const next = b.players.map(toDot);
  return a.players.map(toDot).map((p) => {
    let best: Dot | undefined;
    let bestD = 4; // metres — anything further is a different player
    for (const q of next) {
      if (q.home !== p.home) continue;
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < bestD) {
        bestD = d;
        best = q;
      }
    }
    return best ? { ...p, x: p.x + (best.x - p.x) * k, y: p.y + (best.y - p.y) * k } : p;
  });
}

function ballAt(t: number): [number, number] | null {
  const i = Math.floor(t);
  const a = frames[Math.min(i, frames.length - 1)]?.ball;
  const b = frames[Math.min(i + 1, frames.length - 1)]?.ball;
  if (!a) return null;
  const k = t - i;
  const [x, y] = b ? [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k] : a;
  return [x, y];
}

const HOME = C.sky;
const AWAY = C.orange;
// The upright box; the horizontal pitch inside it is PITCH_HEIGHT x PITCH_WIDTH.
const PITCH_WIDTH = 680;
const PITCH_HEIGHT = Math.round(
  ((PITCH_WIDTH - PAD.top - PAD.bottom) * clip.pitchLength) / clip.pitchWidth +
    PAD.left +
    PAD.right,
);

export function TrackingReel() {
  const frame = useCurrentFrame();
  const t = trackingIndex(frame);
  const players = playersAt(t);
  const ball = ballAt(t);
  const trail = [6, 4, 2]
    .map((back) => ({ from: ballAt(Math.max(START, t - back)), to: ball }))
    .filter((s): s is { from: [number, number]; to: [number, number] } => !!s.from && !!s.to);
  const current = frames[Math.min(Math.round(t), frames.length - 1)];
  const slow = frame - INTRO >= A && frame - INTRO < A + B;
  const afterShot = frame - INTRO >= A + B;
  const goalFlash = interpolate(frame - INTRO - A - B, [0, 8, 60], [0, 1, 1], clamp);
  const scorerTeam = clip.scoringTeamIsHome ? clip.home : clip.away;

  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans, color: C.text }}>
      <Backdrop />
      <div style={{ position: "absolute", top: 110, left: 60 }}>
        <Lockup size={46} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 230,
          left: 60,
          right: 100,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <Eyebrow>SkillCorner open data · 10 fps tracking</Eyebrow>
        <div style={{ fontSize: 58, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          22 players. Every frame.
          <br />
          <span style={{ color: C.accent }}>In the browser.</span>
        </div>
      </div>

      <div style={{ position: "absolute", top: 440, left: (1080 - PITCH_WIDTH) / 2 }}>
        <PitchStage>
          <Upright width={PITCH_WIDTH} height={PITCH_HEIGHT} turn={turn}>
            <Pitch
              type="skillcorner"
              dimensions={{ length: clip.pitchLength, width: clip.pitchWidth }}
              width={PITCH_HEIGHT}
              height={PITCH_WIDTH}
              padding={PAD}
              appearance={appearance}
            >
              <Voronoi
                data={players}
                x={(p) => p.x}
                y={(p) => p.y}
                fill={(p) => (p.home ? HOME : AWAY)}
                fillOpacity={0.16}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth={1}
              />
              <Comet
                data={trail}
                x={(s) => s.from[0]}
                y={(s) => s.from[1]}
                x2={(s) => s.to[0]}
                y2={(s) => s.to[1]}
                color="white"
                gradient
                endWidth={6}
              />
              <Scatter
                data={players}
                x={(p) => p.x}
                y={(p) => p.y}
                r={11}
                fill={(p) => (p.home ? HOME : AWAY)}
                // Broadcast tracking only sees what the camera framed; the
                // rest is extrapolated, and `is_detected` says which.
                fillOpacity={(p) => (p.detected ? 1 : 0.35)}
                stroke="rgba(6,16,11,0.9)"
                strokeWidth={2}
              />
              {ball && (
                <Scatter
                  data={[ball]}
                  x={(b) => b[0]}
                  y={(b) => b[1]}
                  r={7}
                  fill="white"
                  stroke="#111"
                  strokeWidth={2}
                />
              )}
            </Pitch>
          </Upright>
        </PitchStage>

        {/* Top-left overlay: match + frame counter, the "it's real data" tell. */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: 22,
            fontFamily: FONT.mono,
            fontSize: 22,
            color: "rgba(255,255,255,0.85)",
            background: "rgba(6,16,11,0.7)",
            borderRadius: 10,
            padding: "10px 14px",
            lineHeight: 1.45,
          }}
        >
          <div>
            <span style={{ color: HOME }}>●</span> {clip.home}{" "}
            <span style={{ color: AWAY }}>●</span> {clip.away}
          </div>
          <div style={{ color: C.muted }}>
            frame {current?.frame.toLocaleString("en-GB")}
            {slow ? "  ·  0.4× slow-mo" : ""}
          </div>
        </div>

        {afterShot && (
          <div
            style={{
              position: "absolute",
              top: PITCH_HEIGHT * 0.55,
              left: 0,
              right: 0,
              textAlign: "center",
              opacity: goalFlash,
              transform: `scale(${0.8 + goalFlash * 0.2})`,
            }}
          >
            <div
              style={{
                fontSize: 120,
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: C.text,
                textShadow: "0 8px 40px rgba(0,0,0,0.6)",
              }}
            >
              GOAL
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: C.text,
                textShadow: "0 4px 20px rgba(0,0,0,0.8)",
              }}
            >
              {clip.scorer} · {scorerTeam}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          top: 440 + PITCH_HEIGHT + 24,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 14,
        }}
      >
        {["<Voronoi>", "<Scatter>", "<Comet>"].map((tag) => (
          <Tag key={tag} size={26}>
            {tag}
          </Tag>
        ))}
      </div>

      <Sequence from={TRACKING_DURATION - 90}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
}
