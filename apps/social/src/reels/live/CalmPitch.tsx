/**
 * The calm cut's pitch: a flat pitch at a gentle broadcast tilt showing where
 * players have been recently (their averaged positions and the Voronoi built
 * on them), not each 360 frame as it comes. At every goal, and at Kolo
 * Muani's late chance, the pitch turns and settles flat on the attacking half
 * to show the shot's own frame: every player where StatsBomb placed them at
 * the strike, the space each controlled, and the shot.
 */
import { Arrows, Pitch, Scatter, usePitch, Voronoi } from "@pitchkit/react";
import type { CSSProperties } from "react";
import { PitchStage } from "../../components/Chrome";
import { wcFinal as F } from "../../data";
import { appearance, PAD } from "../../theme";
import { averagedAt, ballAt, frameNear } from "./calm360";
import { ARG, FRA } from "./scene360";
import type { Timeline } from "./timeline";

const PW = 1500;
const PH = Math.round(((PW - PAD.left - PAD.right) * 80) / 120 + PAD.top + PAD.bottom);
const K = (PW - PAD.left - PAD.right) / 120;
const S = PW / 1500;

const NIGHT = {
  "--pitch-surface": "#0b1220",
  "--pitch-stripe": "rgba(255, 255, 255, 0.025)",
  "--pitch-lines": "rgba(255, 255, 255, 0.4)",
  "--pitch-line-width": "2",
} as CSSProperties;

interface FramePlayer {
  x: number;
  y: number;
  argentina: boolean;
  keeper: boolean;
  name: string;
}
interface Replay {
  frame: number;
  argentinaShot: boolean;
  shooter: { x: number; y: number; name: string };
  end: { x: number; y: number };
  players: FramePlayer[];
}

/** Into Argentina's frame (they attack left to right). */
const toArg = (argentinaShot: boolean, x: number, y: number) =>
  argentinaShot ? { x, y } : { x: 120 - x, y: 80 - y };

function replaysOf(T: Timeline): Replay[] {
  const goals = T.GOALS.map((g): Replay => {
    const argentinaShot = g.team === F.home;
    const shooter = { ...toArg(argentinaShot, g.x, g.y), name: g.scorer };
    const end = toArg(argentinaShot, g.endX, g.endY);
    // Penalties have no freeze frame on the shot; use the nearest 360 frame.
    const players: FramePlayer[] = g.freezeFrame.length
      ? g.freezeFrame.map((p) => ({
          ...toArg(argentinaShot, p.x, p.y),
          argentina: p.teammate === argentinaShot,
          keeper: p.keeper,
          name: p.keeper ? p.player : "",
        }))
      : frameNear(g.u)
          .players.filter((p) => !p.actor)
          .map((p) => ({ x: p.x, y: p.y, argentina: p.argentina, keeper: p.keeper, name: "" }));
    return { frame: g.frame, argentinaShot, shooter, end, players };
  });
  const s = F.theSave;
  const save: Replay = {
    frame: T.FRAME.save,
    argentinaShot: false,
    shooter: { ...toArg(false, s.x, s.y), name: s.player },
    end: toArg(false, s.endX, s.endY),
    players: s.freezeFrame.map((p) => ({
      ...toArg(false, p.x, p.y),
      argentina: !p.teammate,
      keeper: p.keeper,
      name: p.keeper ? s.keeper : "",
    })),
  };
  return [...goals, save];
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Upright names on a pitch the camera has turned by `turn` degrees. */
function Labels({
  items,
  turn,
}: {
  items: { x: number; y: number; name: string; keeper?: boolean }[];
  turn: number;
}) {
  const { transform } = usePitch();
  return (
    <>
      {items
        .filter((p) => p.name)
        .map((p, i) => {
          const [px, py] = transform.toPixel([p.x, p.y]);
          return (
            <g key={i} transform={`translate(${px} ${py}) rotate(${-turn})`}>
              <text
                // Keepers' names sit under their dot so they don't collide with the shooter's.
                y={(p.keeper ? 48 : -30) * S}
                textAnchor="middle"
                style={{
                  font: `800 ${30 * S}px Inter, system-ui, sans-serif`,
                  fill: "#ffffff",
                  paintOrder: "stroke",
                  stroke: "rgba(5,8,16,0.9)",
                  strokeWidth: 7 * S,
                }}
              >
                {p.name}
              </text>
            </g>
          );
        })}
    </>
  );
}

function Win({ amount }: { amount: number }) {
  const { transform } = usePitch();
  if (amount <= 0) return null;
  const [x0, y0] = transform.toPixel([0, 0]);
  const [x1, y1] = transform.toPixel([120, 80]);
  return (
    <rect
      x={Math.min(x0, x1)}
      y={Math.min(y0, y1)}
      width={Math.abs(x1 - x0)}
      height={Math.abs(y1 - y0)}
      fill={ARG}
      fillOpacity={0.6 * amount}
    />
  );
}

export function CalmPitch({
  T,
  frame,
  u,
  win,
}: {
  T: Timeline;
  frame: number;
  u: number;
  win: number;
}) {
  const replays = replaysOf(T);
  const active = replays.find((r) => frame >= r.frame && frame <= r.frame + T.replay);
  const t = active
    ? smooth(Math.min((frame - active.frame) / 20, 1)) *
      smooth(Math.min((active.frame + T.replay - frame) / 20, 1))
    : 0;

  // Camera: a gentle tilt with Argentina attacking up; for a replay, flat on
  // the attacking half with the scoring team attacking up.
  const base = { tilt: 38, rot: -80 + 4 * Math.sin(frame / 160), scale: 0.64, fx: 60, fy: 40 };
  const shot = active?.argentinaShot ?? true;
  const goal = { tilt: 0, rot: shot ? -90 : 90, scale: 1.08, fx: shot ? 86 : 34, fy: 40 };
  const mix = (a: number, b: number) => a + (b - a) * t;
  const cam = {
    tilt: mix(base.tilt, goal.tilt),
    rot: mix(base.rot, goal.rot),
    scale: mix(base.scale, goal.scale),
    fx: mix(base.fx, goal.fx),
    fy: mix(base.fy, goal.fy),
  };

  const players = averagedAt(u);
  const shown = players.filter((p) => p.confidence > 0.12);
  const ball = ballAt(u);
  const freeze = active
    ? [...active.players, { ...active.shooter, argentina: active.argentinaShot, keeper: false }]
    : [];

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transformOrigin: "0 0",
        transform: [
          "translate(540px, 435px)",
          "perspective(1900px)",
          `rotateX(${cam.tilt}deg)`,
          `rotateZ(${cam.rot}deg)`,
          `scale(${cam.scale})`,
          `translate(${-(PAD.left + cam.fx * K)}px, ${-(PAD.top + cam.fy * K)}px)`,
        ].join(" "),
      }}
    >
      <PitchStage style={NIGHT}>
        <Pitch type="statsbomb" width={PW} height={PH} padding={PAD} appearance={appearance}>
          <g opacity={1 - t}>
            <Voronoi
              data={shown}
              x={(p) => p.x}
              y={(p) => p.y}
              fill={(p) => (p.argentina ? ARG : FRA)}
              fillOpacity={(p) => 0.75 * p.confidence}
              stroke="rgba(5,8,16,0.8)"
              strokeWidth={2}
            />
            <Scatter
              data={shown}
              x={(p) => p.x}
              y={(p) => p.y}
              r={14 * S}
              fill={(p) => (p.argentina ? ARG : FRA)}
              fillOpacity={(p) => Math.min(1, 0.4 + p.confidence)}
              stroke="rgba(5,8,16,0.9)"
              strokeWidth={2 * S}
            />
            {ball && (
              <Scatter
                data={[ball]}
                x={(b) => b.x}
                y={(b) => b.y}
                r={9 * S}
                fill="#fde047"
                stroke="#000000"
                strokeWidth={2 * S}
              />
            )}
          </g>
          {active && (
            <g opacity={t}>
              <Voronoi
                data={freeze}
                x={(p) => p.x}
                y={(p) => p.y}
                fill={(p) => (p.argentina ? ARG : FRA)}
                fillOpacity={0.6}
                stroke="rgba(5,8,16,0.85)"
                strokeWidth={2}
              />
              <Arrows
                data={[{ ...active.shooter, x2: active.end.x, y2: active.end.y }]}
                x={(d) => d.x}
                y={(d) => d.y}
                x2={(d) => d.x2}
                y2={(d) => d.y2}
                stroke="#fde047"
                strokeWidth={5 * S}
                headSize={18 * S}
              />
              <Scatter
                data={freeze}
                x={(p) => p.x}
                y={(p) => p.y}
                r={(p) => (p === freeze.at(-1) ? 17 : 13) * S}
                fill={(p) => (p.argentina ? ARG : FRA)}
                stroke={(p) => (p === freeze.at(-1) || p.keeper ? "#ffffff" : "rgba(5,8,16,0.9)")}
                strokeWidth={(p) => (p === freeze.at(-1) || p.keeper ? 4 : 2) * S}
              />
              <Labels items={[...active.players, active.shooter]} turn={cam.rot} />
            </g>
          )}
          <Win amount={win} />
        </Pitch>
      </PitchStage>
    </div>
  );
}
