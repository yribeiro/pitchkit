/**
 * Reel 05: the 2022 World Cup final, Argentina 3–3 France, in 37 seconds.
 *
 * Story: France didn't have a shot for 66 minutes (the hook, with a counter
 * stuck on 0); then Mbappé scored twice in 95 seconds; Messi, then Mbappé's
 * hat-trick in extra time; Kolo Muani's 0.28 xG chance in the 123rd minute,
 * saved; the shootout, kick by kick, in the goal mouth; the whole final as
 * one momentum chart; a comment CTA; the end card.
 *
 * One pitch carries the match. A virtual camera (CSS 3D on the pitch
 * wrapper) follows the story: tilted like a broadcast camera, it spins
 * 180° each time the attacking team changes, so whoever is attacking always
 * goes up the screen, and pushes in for the late chance. A match clock runs
 * through it all, every shot lands on the pitch as it happens, and every
 * beat has a sound (see `cues`).
 */
import type { CSSProperties, ReactNode } from "react";
import { Arrows, Comet, MomentumChart, Pitch, Scatter } from "@pitchkit/react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { pitchHeightFor } from "../charts";
import { PitchStage } from "../components/Chrome";
import { EndCard } from "../components/EndCard";
import { wcFinal as F } from "../data";
import type { FinalMove } from "../data";
import { appearance, C, FONT, PAD } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const pop = Easing.out(Easing.back(2.2));

const ARG = C.sky;
const FRA = "#fb7185";
const colorOf = (team: string) => (team === F.home ? ARG : FRA);

/** A brighter, more saturated pitch than the house theme: the breakout reels are bright. */
const GRASS = {
  "--pitch-surface": "#15693a",
  "--pitch-stripe": "rgba(255, 255, 255, 0.07)",
  "--pitch-lines": "rgba(255, 255, 255, 0.9)",
} as CSSProperties;

/* Timeline (30 fps) ------------------------------------------------------- */

/** France's first shot: the hook's counter flips from 0. */
const FIRST_SHOT = 80;
const MBAPPE_PEN = 140;
const MBAPPE_VOLLEY = 260;
const MESSI = 360;
const MBAPPE_HAT = 432;
const SAVE_SHOT = 520;
const SAVED = 560;
const SHOOTOUT = 610;
const KICK_AT = 650;
const KICK_GAP = 17;
const CHAMPIONS = KICK_AT + 7 * KICK_GAP + 14;
const MOMENTUM = 820;
const CTA = 950;
const END_AT = 1040;
export const FINAL_DURATION = END_AT + 90;

/** Match clock (seconds) at video frames; linear between keys. */
const CLOCK_KEYS: [number, number][] = [
  [0, 1312],
  [FIRST_SHOT, F.stats.firstFranceShot.clock],
  [MBAPPE_PEN - 10, F.goals[2]!.clock - 14],
  [MBAPPE_PEN, F.goals[2]!.clock],
  [MBAPPE_VOLLEY, F.goals[3]!.clock],
  [300, F.goals[3]!.clock + 12],
  [MESSI - 6, F.goals[4]!.clock - 2],
  [MESSI, F.goals[4]!.clock],
  [400, F.goals[4]!.clock + 14],
  [MBAPPE_HAT, F.goals[5]!.clock],
  [462, F.goals[5]!.clock + 8],
  [SAVE_SHOT, F.theSave.clock],
  [SHOOTOUT, F.theSave.clock + 30],
];
const clockAt = (frame: number) =>
  interpolate(
    frame,
    CLOCK_KEYS.map((k) => k[0]),
    CLOCK_KEYS.map((k) => k[1]),
    clamp,
  );
/** The first video frame at which the clock reaches `seconds`. */
function frameAtClock(seconds: number) {
  for (let f = 0; f <= SHOOTOUT; f++) if (clockAt(f) >= seconds) return f;
  return SHOOTOUT;
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Every in-play shot with the frame it lands on. */
const SHOTS = F.shots.map((s) => ({ ...s, at: frameAtClock(s.clock) }));
const GOALS = F.goals.map((g) => ({ ...g, at: frameAtClock(g.clock) }));

/* The camera ---------------------------------------------------------------- */

/** Drawn large and scaled down by the camera, so the push-ins stay sharp. */
const PW = 2400;
/** Marker sizes are tuned for a 1500 px pitch. */
const S = PW / 1500;
const PH = pitchHeightFor(PW);
const K = (PW - PAD.left - PAD.right) / 120;
/** France attack the other way: flip their coordinates onto Argentina's frame. */
const onPitch = (team: string, x: number, y: number) =>
  team === F.home ? { x, y } : { x: 120 - x, y: 80 - y };

interface Shot {
  f: number;
  tilt: number;
  /** Degrees; -90 has Argentina attacking up the screen, 90 France. */
  rot: number;
  zoom: number;
  /** The pitch point (Argentina's frame) at the screen's focus. */
  x: number;
  y: number;
}
// The spins always turn the same way (-90 → 90 → 270 → 450), so each one reads as a turn.
const CAMERA: Shot[] = [
  { f: 0, tilt: 50, rot: -90, zoom: 1.05 / S, x: 90, y: 40 },
  { f: 72, tilt: 48, rot: -90, zoom: 1.14 / S, x: 96, y: 40 },
  { f: FIRST_SHOT + 2, tilt: 48, rot: -90, zoom: 1.14 / S, x: 96, y: 40 },
  { f: 118, tilt: 46, rot: 90, zoom: 1.02 / S, x: 26, y: 40 },
  { f: MBAPPE_PEN, tilt: 46, rot: 90, zoom: 1.18 / S, x: 16, y: 40 },
  { f: 200, tilt: 44, rot: 90, zoom: 0.98 / S, x: 30, y: 44 },
  { f: MBAPPE_VOLLEY, tilt: 44, rot: 90, zoom: 1.14 / S, x: 18, y: 46 },
  { f: 300, tilt: 46, rot: 90, zoom: 1.1 / S, x: 20, y: 44 },
  { f: 334, tilt: 46, rot: 270, zoom: 1.04 / S, x: 100, y: 40 },
  { f: MESSI, tilt: 46, rot: 270, zoom: 1.22 / S, x: 108, y: 40 },
  { f: 402, tilt: 46, rot: 270, zoom: 1.22 / S, x: 108, y: 40 },
  { f: MBAPPE_HAT - 6, tilt: 46, rot: 450, zoom: 1.18 / S, x: 16, y: 40 },
  { f: 466, tilt: 44, rot: 450, zoom: 1.12 / S, x: 20, y: 40 },
  { f: SAVE_SHOT, tilt: 32, rot: 450, zoom: 1.7 / S, x: 13, y: 37 },
  { f: SAVED, tilt: 26, rot: 450, zoom: 2.05 / S, x: 8, y: 37 },
  { f: SHOOTOUT, tilt: 22, rot: 450, zoom: 2.4 / S, x: 6, y: 37 },
];
function cameraAt(frame: number): Shot {
  const i = CAMERA.findIndex((k) => k.f > frame);
  if (i === -1) return CAMERA.at(-1)!;
  if (i === 0) return CAMERA[0]!;
  const a = CAMERA[i - 1]!;
  const b = CAMERA[i]!;
  const t = ease((frame - a.f) / (b.f - a.f));
  const mix = (p: number, q: number) => p + (q - p) * t;
  return {
    f: frame,
    tilt: mix(a.tilt, b.tilt),
    rot: mix(a.rot, b.rot),
    zoom: mix(a.zoom, b.zoom),
    x: mix(a.x, b.x),
    y: mix(a.y, b.y),
  };
}

/** A few frames of shake after each big moment. */
const IMPACTS = [...GOALS.map((g) => g.at + 6), SAVED, CHAMPIONS];
function shakeAt(frame: number) {
  const hit = IMPACTS.find((at) => frame >= at && frame < at + 9);
  if (hit === undefined) return { x: 0, y: 0 };
  const k = 1 - (frame - hit) / 9;
  return { x: Math.sin(frame * 2.9) * 12 * k, y: Math.cos(frame * 3.7) * 8 * k };
}

/* Pieces -------------------------------------------------------------------- */

/** A build-up drawn in move by move: `progress` 0..moves.length. */
function drawn(moves: FinalMove[], team: string, progress: number) {
  return moves
    .map((m, i) => ({ m, t: Math.min(Math.max(progress - i, 0), 1) }))
    .filter(({ t }) => t > 0)
    .map(({ m, t }) => {
      const a = onPitch(team, m.x, m.y);
      const b = onPitch(team, m.endX, m.endY);
      return { kind: m.kind, x: a.x, y: a.y, x2: a.x + (b.x - a.x) * t, y2: a.y + (b.y - a.y) * t };
    });
}

/** A ball flying from a shot to where it ended, `t` 0..1. */
function flight(team: string, s: { x: number; y: number; endX: number; endY: number }, t: number) {
  const a = onPitch(team, s.x, s.y);
  const b = onPitch(team, s.endX, s.endY);
  return { x: a.x, y: a.y, x2: a.x + (b.x - a.x) * t, y2: a.y + (b.y - a.y) * t };
}

function MatchPitch({ frame }: { frame: number }) {
  const { fps } = useVideoConfig();
  const shots = SHOTS.filter((s) => frame >= s.at);
  const radius = (s: (typeof SHOTS)[number]) => {
    const grow = spring({ frame: frame - s.at, fps, config: { damping: 9, mass: 0.5 } });
    return (9 + Math.sqrt(s.xg) * 30) * grow * S;
  };

  // Build-ups behind the open-play goals, and Kolo Muani's chance.
  const chains = [
    { goal: GOALS[3]!, from: 190, to: MBAPPE_VOLLEY - 8, last: 5 },
    { goal: GOALS[4]!, from: MESSI - 34, to: MESSI - 6, last: 3 },
  ].flatMap(({ goal, from, to, last }) => {
    const moves = goal.moves.slice(-last);
    const progress = interpolate(frame, [from, to], [0, moves.length], clamp);
    const fade = interpolate(frame, [goal.at + 40, goal.at + 56], [1, 0], clamp);
    return frame >= from ? drawn(moves, goal.team, progress).map((m) => ({ ...m, fade })) : [];
  });
  const saveMoves = F.theSave.moves.slice(-2);
  const saveChain =
    frame >= SAVE_SHOT - 34
      ? drawn(
          saveMoves,
          F.away,
          interpolate(frame, [SAVE_SHOT - 34, SAVE_SHOT - 4], [0, saveMoves.length], clamp),
        )
      : [];

  // The ball on its way in, for every goal and the saved chance.
  const balls = [
    ...GOALS.map((g) => ({ team: g.team, s: g, from: g.at - 2, len: g.penalty ? 6 : 8 })),
    { team: F.away, s: F.theSave, from: SAVE_SHOT, len: SAVED - SAVE_SHOT },
  ]
    .filter(({ from, len }) => frame >= from && frame < from + len + 30)
    .map(({ team, s, from, len }) => {
      const t = interpolate(frame, [from, from + len], [0, 1], {
        ...clamp,
        easing: Easing.in(Easing.quad),
      });
      return {
        ...flight(team, s, t),
        fade: interpolate(frame, [from + len + 10, from + len + 30], [1, 0], clamp),
      };
    });

  const freeze = interpolate(frame, [SAVE_SHOT - 30, SAVE_SHOT - 10], [0, 1], clamp);
  // Earlier shots step back while the late chance plays out.
  const focusSave = freeze;
  const keeperGlow = interpolate(frame, [SAVED, SAVED + 6], [0, 1], clamp);

  return (
    <PitchStage style={GRASS}>
      <Pitch type="statsbomb" width={PW} height={PH} padding={PAD} appearance={appearance}>
        <Scatter
          data={shots}
          x={(s) => onPitch(s.team, s.x, s.y).x}
          y={(s) => onPitch(s.team, s.x, s.y).y}
          r={radius}
          fill={(s) => colorOf(s.team)}
          fillOpacity={(s) => (s.goal ? 1 : 0.8) * (1 - 0.7 * focusSave)}
          stroke={(s) => (s.goal ? "white" : "rgba(4,12,8,0.85)")}
          strokeWidth={(s) => (s.goal ? 5 : 2) * S}
        />
        {chains.length > 0 && (
          <g opacity={Math.min(...chains.map((c) => c.fade))}>
            <Comet
              data={chains.filter((m) => m.kind === "carry")}
              x={(m) => m.x}
              y={(m) => m.y}
              x2={(m) => m.x2}
              y2={(m) => m.y2}
              color="white"
              gradient
              endWidth={12 * S}
            />
            <Arrows
              data={chains.filter((m) => m.kind === "pass")}
              x={(m) => m.x}
              y={(m) => m.y}
              x2={(m) => m.x2}
              y2={(m) => m.y2}
              stroke="white"
              strokeWidth={6 * S}
              headSize={20 * S}
            />
          </g>
        )}
        <g opacity={freeze}>
          <Scatter
            data={F.theSave.freezeFrame}
            x={(p) => 120 - p.x}
            y={(p) => 80 - p.y}
            r={(p) => (p.keeper ? 15 + 8 * keeperGlow : 13) * S}
            fill={(p) => (p.teammate ? FRA : ARG)}
            stroke={(p) => (p.keeper ? "white" : "rgba(4,12,8,0.85)")}
            strokeWidth={(p) => (p.keeper ? 5 : 2) * S}
          />
          <Arrows
            data={saveChain}
            x={(m) => m.x}
            y={(m) => m.y}
            x2={(m) => m.x2}
            y2={(m) => m.y2}
            stroke="white"
            strokeWidth={6 * S}
            headSize={20 * S}
          />
        </g>
        {balls.map((b, i) => (
          <g key={i} opacity={b.fade}>
            <Comet
              data={[b]}
              x={(d) => d.x}
              y={(d) => d.y}
              x2={(d) => d.x2}
              y2={(d) => d.y2}
              color="#fde047"
              gradient
              endWidth={16 * S}
            />
          </g>
        ))}
      </Pitch>
    </PitchStage>
  );
}

/** Text that pops in, holds and drops out: one line per beat. */
function Beat({
  frame,
  from,
  to,
  children,
  top = 1240,
}: {
  frame: number;
  from: number;
  to: number;
  children: ReactNode;
  top?: number;
}) {
  if (frame < from || frame > to) return null;
  const inT = interpolate(frame, [from, from + 8], [0, 1], { ...clamp, easing: pop });
  const outT = interpolate(frame, [to - 6, to], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 60,
        right: 60,
        textAlign: "center",
        opacity: Math.min(inT * 1.4, 1) * outT,
        transform: `scale(${0.6 + 0.4 * inT}) translateY(${(1 - outT) * 30}px)`,
      }}
    >
      {children}
    </div>
  );
}

const big = (size: number, color: string = C.text): CSSProperties => ({
  fontFamily: FONT.display,
  fontSize: size,
  lineHeight: 0.95,
  color,
  letterSpacing: "0.01em",
  textShadow: "0 6px 30px rgba(0,0,0,0.75)",
});
const small: CSSProperties = {
  fontFamily: FONT.sans,
  fontSize: 34,
  fontWeight: 800,
  color: C.text,
  marginTop: 14,
  textShadow: "0 3px 16px rgba(0,0,0,0.9)",
};

function ScoreBug({ frame }: { frame: number }) {
  const { fps } = useVideoConfig();
  const scored = GOALS.filter((g) => frame >= g.at + 6);
  const home = scored.filter((g) => g.team === F.home).length;
  const away = scored.length - home;
  const last = scored.at(-1);
  const bump = last
    ? spring({ frame: frame - last.at - 6, fps, config: { damping: 8, mass: 0.4 } })
    : 1;
  const clock = frame < SHOOTOUT ? mmss(clockAt(frame)) : "PENS";
  const team = (name: string, color: string) => (
    <span style={{ ...big(64, color), textShadow: "none", width: 150, textAlign: "center" }}>
      {name}
    </span>
  );
  return (
    <div
      style={{
        position: "absolute",
        top: 205,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{ fontFamily: FONT.display, fontSize: 30, letterSpacing: "0.2em", color: "#fde047" }}
      >
        WORLD CUP FINAL 2022
      </div>
      <div
        style={{
          marginTop: 10,
          display: "flex",
          alignItems: "center",
          gap: 26,
          background: "rgba(0,0,0,0.78)",
          border: "2px solid rgba(255,255,255,0.14)",
          borderRadius: 22,
          padding: "10px 34px 12px",
        }}
      >
        {team("ARG", ARG)}
        <span
          style={{
            ...big(92),
            textShadow: "none",
            display: "inline-block",
            transform: `scale(${1 + 0.35 * (1 - bump)})`,
          }}
        >
          {home}–{away}
        </span>
        {team("FRA", FRA)}
      </div>
      <div
        style={{
          marginTop: 10,
          fontFamily: FONT.mono,
          fontSize: 34,
          fontWeight: 700,
          color: C.text,
          background: "rgba(0,0,0,0.78)",
          borderRadius: 12,
          padding: "4px 18px",
        }}
      >
        {clock}
      </div>
    </div>
  );
}

/* Scenes -------------------------------------------------------------------- */

/** Where the camera's focus lands on screen: high, so the action sits just under the score bug. */
const ANCHOR_Y = 800;

function MatchScene() {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  const shake = shakeAt(frame);
  const focus = { x: PAD.left + cam.x * K, y: PAD.top + cam.y * K };
  const camera = [
    `translate(${540 + shake.x}px, ${ANCHOR_Y + shake.y}px)`,
    "perspective(1800px)",
    `rotateX(${cam.tilt}deg)`,
    `rotateZ(${cam.rot}deg)`,
    `scale(${cam.zoom})`,
    `translate(${-focus.x}px, ${-focus.y}px)`,
  ].join(" ");
  const out = interpolate(frame, [SHOOTOUT - 12, SHOOTOUT], [1, 0], clamp);

  const franceShots = SHOTS.filter((s) => s.team === F.away && frame >= s.at).length;
  const flip = interpolate(frame, [FIRST_SHOT, FIRST_SHOT + 5], [0, 1], clamp);
  const stopwatch = interpolate(frame, [MBAPPE_PEN, MBAPPE_VOLLEY], [0, F.stats.mbappeGap], clamp);
  const xgMeter = interpolate(frame, [SAVE_SHOT, SAVED - 6], [0, F.theSave.xg], clamp);

  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div
        style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: camera }}
      >
        <MatchPitch frame={frame} />
      </div>
      {/* Shade the top and bottom so the HUD and the captions read over the pitch. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.8) 82%)",
        }}
      />
      <ScoreBug frame={frame} />

      <Beat frame={frame} from={-20} to={MBAPPE_PEN - 48} top={1040}>
        <div style={big(70)}>FRANCE SHOTS</div>
        <div
          style={{
            ...big(300, FRA),
            transform: `scale(${1 + 0.4 * Math.sin(flip * Math.PI)})`,
          }}
        >
          {franceShots}
        </div>
        <div style={small}>
          {frame < FIRST_SHOT
            ? "in the first 66 minutes"
            : `at ${mmss(F.stats.firstFranceShot.clock)}`}
        </div>
      </Beat>
      <Beat frame={frame} from={MBAPPE_PEN - 46} to={MBAPPE_PEN + 4}>
        <div style={big(128)}>THEN</div>
        <div style={big(128, FRA)}>MBAPPÉ</div>
        <div style={big(128)}>HAPPENED.</div>
      </Beat>
      <Beat frame={frame} from={MBAPPE_PEN + 6} to={MBAPPE_VOLLEY + 44}>
        <div
          style={{
            ...big(220, frame >= MBAPPE_VOLLEY ? FRA : C.text),
            fontFamily: FONT.mono,
            fontWeight: 800,
          }}
        >
          {mmss(stopwatch)}
        </div>
        <div style={small}>
          {frame < MBAPPE_VOLLEY ? "since his penalty" : "TWO GOALS. 95 SECONDS."}
        </div>
      </Beat>
      <Beat frame={frame} from={306} to={MESSI - 8} top={1180}>
        <div style={big(110, "#fde047")}>EXTRA TIME</div>
      </Beat>
      <Beat frame={frame} from={MESSI + 4} to={MBAPPE_HAT - 14}>
        <div style={big(150, ARG)}>MESSI.</div>
        <div style={small}>{F.stats.messiRebound} second after Lautaro&apos;s shot was saved</div>
      </Beat>
      <Beat frame={frame} from={MBAPPE_HAT + 6} to={SAVE_SHOT - 36}>
        <div style={big(150, FRA)}>HAT-TRICK.</div>
        <div style={small}>Mbappé, 118th minute. 3–3.</div>
      </Beat>
      <Beat frame={frame} from={SAVE_SHOT - 34} to={SAVED - 2}>
        <div style={big(110)}>123RD MINUTE</div>
        <div style={{ ...big(84, FRA), marginTop: 10 }}>
          {F.theSave.player.toUpperCase()}, THROUGH
        </div>
        <div
          style={{
            margin: "26px auto 0",
            width: 620,
            height: 26,
            borderRadius: 13,
            background: "rgba(255,255,255,0.15)",
            overflow: "hidden",
          }}
        >
          <div style={{ width: `${(xgMeter / 0.5) * 100}%`, height: "100%", background: FRA }} />
        </div>
        <div style={small}>{xgMeter.toFixed(2)} xG</div>
      </Beat>
      <Beat frame={frame} from={SAVED} to={SHOOTOUT}>
        <div style={big(230)}>SAVED.</div>
        <div style={small}>{F.theSave.keeper}, with the World Cup on the line</div>
      </Beat>
    </AbsoluteFill>
  );
}

/** The goal mouth from behind the penalty taker; every kick lands where it went. */
function Shootout() {
  const frame = useCurrentFrame() + SHOOTOUT;
  const { fps } = useVideoConfig();
  const fade = interpolate(frame, [SHOOTOUT, SHOOTOUT + 12], [0, 1], clamp);
  const GX = 100;
  const GW = 880;
  const U = GW / 8;
  const GROUND = 900;
  const toX = (y: number) => GX + (y - 36) * U;
  const toY = (z: number) => GROUND - z * U;
  const champions = spring({ frame: frame - CHAMPIONS, fps, config: { damping: 10, mass: 0.6 } });

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <AbsoluteFill
        style={{ background: "radial-gradient(circle at 50% 45%, #0d3b22 0%, #000 70%)" }}
      />
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center" }}>
        <div style={big(120)}>PENALTIES</div>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* The net, then the frame. */}
        {Array.from({ length: 17 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={GX + (i * GW) / 16}
            y1={toY(2.67)}
            x2={GX + (i * GW) / 16}
            y2={GROUND}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={2}
          />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={GX}
            y1={toY(2.67) + (i * 2.67 * U) / 6}
            x2={GX + GW}
            y2={toY(2.67) + (i * 2.67 * U) / 6}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={2}
          />
        ))}
        <path
          d={`M ${GX} ${GROUND} V ${toY(2.67)} H ${GX + GW} V ${GROUND}`}
          fill="none"
          stroke="white"
          strokeWidth={14}
          strokeLinejoin="round"
        />
        <line
          x1={0}
          y1={GROUND}
          x2={1080}
          y2={GROUND}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={4}
        />
        {F.kicks.map((k, i) => {
          const at = KICK_AT + i * KICK_GAP;
          if (frame < at) return null;
          const t = interpolate(frame, [at, at + 7], [0, 1], {
            ...clamp,
            easing: Easing.out(Easing.quad),
          });
          const x = 540 + (toX(k.y) - 540) * t;
          const y = 1500 + (toY(k.z) - 1500) * t;
          const r = 60 - 34 * t;
          const color = colorOf(k.team);
          const settled = frame >= at + 7;
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={k.scored ? color : "transparent"}
                stroke={k.scored ? "white" : color}
                strokeWidth={6}
              />
              {settled && !k.scored && (
                <g stroke={color} strokeWidth={8} strokeLinecap="round">
                  <line x1={x - 18} y1={y - 18} x2={x + 18} y2={y + 18} />
                  <line x1={x + 18} y1={y - 18} x2={x - 18} y2={y + 18} />
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {/* Whoever is taking the current kick. */}
      {F.kicks.map((k, i) => {
        const at = KICK_AT + i * KICK_GAP;
        if (frame < at - 4 || frame >= at + KICK_GAP - 4) return null;
        const t = interpolate(frame, [at - 4, at + 2], [0, 1], { ...clamp, easing: pop });
        return (
          <div
            key={k.player}
            style={{
              position: "absolute",
              top: 420,
              left: 0,
              right: 0,
              textAlign: "center",
              opacity: t,
              transform: `scale(${0.7 + 0.3 * t})`,
            }}
          >
            <span style={big(96, colorOf(k.team))}>{k.player.toUpperCase()}</span>
            {frame >= at + 7 && (
              <span style={{ ...big(96, k.scored ? C.text : colorOf(k.team)), marginLeft: 24 }}>
                {k.scored ? "SCORES" : k.outcome === "Saved" ? "SAVED" : "MISSES"}
              </span>
            )}
          </div>
        );
      })}
      {/* The tally, one row per team. */}
      <div style={{ position: "absolute", top: 1000, left: 120, right: 120 }}>
        {[F.home, F.away].map((team) => {
          const kicks = F.kicks
            .map((k, i) => ({ ...k, at: KICK_AT + i * KICK_GAP }))
            .filter((k) => k.team === team);
          const color = colorOf(team);
          return (
            <div
              key={team}
              style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 26 }}
            >
              <div style={{ ...big(64, color), width: 210, textShadow: "none" }}>
                {team === F.home ? "ARG" : "FRA"}
              </div>
              {kicks.map((k) => {
                const on = frame >= k.at + 7;
                return (
                  <div
                    key={k.player}
                    style={{
                      width: 92,
                      height: 92,
                      borderRadius: 46,
                      border: `6px solid ${on ? color : "rgba(255,255,255,0.2)"}`,
                      background: on && k.scored ? color : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ...big(54, color),
                      textShadow: "none",
                    }}
                  >
                    {on && !k.scored ? "X" : ""}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {frame >= CHAMPIONS && (
        <div
          style={{
            position: "absolute",
            top: 1270,
            left: 40,
            right: 40,
            textAlign: "center",
            transform: `scale(${1.5 - 0.5 * champions})`,
            opacity: Math.min(champions * 1.4, 1),
          }}
        >
          <div style={big(150, ARG)}>ARGENTINA</div>
          <div style={big(96)}>WORLD CHAMPIONS</div>
        </div>
      )}
    </AbsoluteFill>
  );
}

const momentumVars = {
  "--pitch-series-1": ARG,
  "--pitch-series-2": FRA,
  "--pitch-chart-surface": "#000000",
  "--pitch-chart-text": "rgba(238, 245, 241, 0.95)",
  "--pitch-chart-muted": "rgba(238, 245, 241, 0.6)",
  "--pitch-grid": "rgba(255, 255, 255, 0.07)",
  "--pitch-axis": "rgba(255, 255, 255, 0.35)",
} as CSSProperties;

/** The whole final as one chart, drawn left to right, with the hook's answer. */
function Momentum() {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [8, 70], [0, 100], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const fade = interpolate(frame, [0, 10], [0, 1], clamp);
  const callback = interpolate(frame, [70, 80], [0, 1], clamp);
  const chip = (label: string, a: number, b: number) => (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "2px solid rgba(255,255,255,0.12)",
        borderRadius: 20,
        padding: "16px 28px",
        textAlign: "center",
      }}
    >
      <div
        style={{ fontFamily: FONT.display, fontSize: 30, letterSpacing: "0.12em", color: C.muted }}
      >
        {label}
      </div>
      <div style={big(80)}>
        <span style={{ color: ARG }}>{a}</span>
        <span style={{ color: C.muted }}> – </span>
        <span style={{ color: FRA }}>{b}</span>
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: fade, background: C.bg }}>
      <div style={{ position: "absolute", top: 230, left: 60, right: 60 }}>
        <div style={big(104)}>THE WHOLE FINAL.</div>
        <div style={big(104, "#fde047")}>ONE CHART.</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 520,
          left: 40,
          width: 1000,
          height: 540,
          clipPath: `inset(0 ${100 - reveal}% 0 0)`,
        }}
      >
        <div style={{ ...momentumVars, width: 500, transform: "scale(2)", transformOrigin: "0 0" }}>
          <MomentumChart
            width={500}
            height={260}
            periods={F.momentum.periods}
            time={(d) => d.minute}
            value={(d) => d.value}
            teams={{ home: F.home, away: F.away }}
            events={F.momentum.events}
            eventTime={(e) => e.minute}
            eventSide={(e) => e.side}
            eventKind={(e) => e.kind}
            eventLabel={(e) => e.label}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1100,
          left: 60,
          right: 60,
          display: "flex",
          gap: 24,
          justifyContent: "center",
          opacity: callback,
        }}
      >
        {chip("SHOTS", F.stats.shots[F.home]!, F.stats.shots[F.away]!)}
        {chip("xG", F.stats.xg[F.home]!, F.stats.xg[F.away]!)}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1300,
          left: 60,
          right: 60,
          textAlign: "center",
          opacity: callback,
          transform: `translateY(${(1 - callback) * 30}px)`,
        }}
      >
        <div style={big(64)}>FRANCE: NO SHOT FOR 66 MINUTES.</div>
        <div style={big(64, FRA)}>STILL SCORED THREE.</div>
      </div>
    </AbsoluteFill>
  );
}

function Cta() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const line = (i: number) => {
    const t = spring({ frame: frame - 4 - i * 7, fps, config: { damping: 12, mass: 0.6 } });
    return { opacity: Math.min(t * 1.5, 1), transform: `translateY(${(1 - t) * 60}px)` };
  };
  return (
    <AbsoluteFill style={{ background: C.bg, justifyContent: "center", padding: "0 80px 140px" }}>
      <div style={{ ...big(150), ...line(0) }}>WHICH FINAL</div>
      <div style={{ ...big(150, C.accent), ...line(1) }}>SHOULD WE</div>
      <div style={{ ...big(150, C.accent), ...line(2) }}>BREAK DOWN</div>
      <div style={{ ...big(150), ...line(3) }}>NEXT?</div>
      <div style={{ ...small, fontSize: 44, marginTop: 40, ...line(4) }}>
        Tell us in the comments ↓
      </div>
    </AbsoluteFill>
  );
}

/* Sound -------------------------------------------------------------------- */

interface Cue {
  at: number;
  src: string;
  volume: number;
  length: number;
}
function cues(): Cue[] {
  const c: Cue[] = [];
  const add = (at: number, name: string, volume: number, length: number) =>
    c.push({ at, src: `sfx/${name}.wav`, volume, length });
  // Every shot lands with a tick; goals hit harder.
  for (const s of SHOTS) if (s.at < SHOOTOUT && !s.goal) add(s.at, "tick", 0.55, 4);
  for (const g of GOALS) {
    add(g.at + 6, "pop", 1, 14);
    add(g.at - 2, "whoosh", 0.35, 18);
  }
  // The stopwatch: a tick for every 5 seconds between Mbappé's goals.
  for (let s = 5; s < F.stats.mbappeGap; s += 5) add(frameAt95(s), "tick", 0.35, 3);
  // The camera spins.
  for (const at of [FIRST_SHOT + 2, 300, 404]) add(at, "whoosh", 0.8, 18);
  add(SAVE_SHOT - 60, "riser", 0.8, 60);
  add(SAVED, "thud", 1, 27);
  F.kicks.forEach((k, i) => {
    const at = KICK_AT + i * KICK_GAP + 6;
    add(at, k.scored ? "pop" : "thud", k.scored ? 0.8 : 0.9, 14);
  });
  add(CHAMPIONS, "thud", 1, 27);
  add(CHAMPIONS, "pop", 1, 14);
  add(MOMENTUM + 6, "whoosh", 0.6, 18);
  add(MOMENTUM + 72, "pop", 0.7, 14);
  for (let i = 0; i < 4; i++) add(CTA + 4 + i * 7, "tick", 0.6, 3);
  add(END_AT, "whoosh", 0.5, 18);
  return c;
}
/** The frame at which the stopwatch between Mbappé's goals shows `s` seconds. */
const frameAt95 = (s: number) =>
  Math.round(MBAPPE_PEN + ((MBAPPE_VOLLEY - MBAPPE_PEN) * s) / F.stats.mbappeGap);

function FinalAudio() {
  return (
    <>
      {cues().map(({ at, src, volume, length }, i) => (
        <Sequence key={i} from={at} durationInFrames={length} layout="none">
          <Audio src={staticFile(src)} volume={volume} />
        </Sequence>
      ))}
    </>
  );
}

/* Reel ---------------------------------------------------------------------- */

export function FinalReel() {
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT.sans, color: C.text }}>
      <FinalAudio />
      <Sequence durationInFrames={SHOOTOUT} layout="none">
        <MatchScene />
      </Sequence>
      <Sequence from={SHOOTOUT} durationInFrames={MOMENTUM - SHOOTOUT}>
        <Shootout />
      </Sequence>
      <Sequence from={MOMENTUM} durationInFrames={CTA - MOMENTUM}>
        <Momentum />
      </Sequence>
      <Sequence from={CTA} durationInFrames={END_AT - CTA}>
        <Cta />
      </Sequence>
      <Sequence from={END_AT} durationInFrames={FINAL_DURATION - END_AT}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
}
