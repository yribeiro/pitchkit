/**
 * Wall post 03 as a video (1080 x 1350): the frame is exactly the static post's
 * — headline, sub, key and tags don't move — and only the markers on the
 * pitch are animated. Spain's build-up to Oyarzabal's winner draws in action
 * by action; just before the shot the horizontal pitch turns to a vertical
 * half pitch and zooms into the goal end, where StatsBomb's 360 positions
 * fade in, then the goal angle, the shot, and the goal.
 */
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GoalChainChart, pitchHeightFor } from "./charts";
import { Key, PostFrame, Tag } from "./components/Chrome";
import { layersReel as L, oyarzabalGoal, surname } from "./data";
import { C, FONT, PAD } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const g = oyarzabalGoal;
const N = g.moves.length;

const WIDTH = 960;
const HEIGHT = pitchHeightFor(WIDTH);
/** Pixels per StatsBomb unit on the horizontal pitch. */
const K = (WIDTH - PAD.left - PAD.right) / 120;
/** Zoom on the vertical half pitch: the 60 x 80 unit half then fills the box. */
const ZOOM = 1.3;
/** Pivot: the middle of the attacking half. */
const PIVOT = { x: PAD.left + 90 * K, y: PAD.top + 40 * K };
const SHIFT = { x: WIDTH / 2 - PIVOT.x, y: HEIGHT / 2 - PIVOT.y };

// Timeline, in frames at 30 fps.
const START = 12;
const PER_MOVE = 20;
const MOVES_END = START + N * PER_MOVE;
const TURN_START = MOVES_END + 8;
const TURN = 42;
const SHOT_START = TURN_START + TURN + 14;
const SHOT = 18;
export const WINNER_DURATION = SHOT_START + SHOT + 78;

/** Where a pitch point lands once the pitch has fully turned and zoomed. */
function turned(x: number, y: number) {
  const vx = PAD.left + x * K - PIVOT.x;
  const vy = PAD.top + y * K - PIVOT.y;
  // rotate(-90deg): (vx, vy) -> (vy, -vx), then zoom and shift.
  return { x: PIVOT.x + SHIFT.x + ZOOM * vy, y: PIVOT.y + SHIFT.y - ZOOM * vx };
}

const angle = L.stats.goalAngles.find((a) => a.player.includes(surname(g.scorer)));

export function WinnerAnimated() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const moves = interpolate(frame, [START, MOVES_END], [0, N], clamp);
  const turnT = interpolate(frame, [TURN_START, TURN_START + TURN], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const shotT = interpolate(frame, [SHOT_START, SHOT_START + SHOT], [0, 1], clamp);
  const freeze = interpolate(turnT, [0.4, 1], [0, 1], clamp);
  const wedge = interpolate(frame, [TURN_START + TURN, TURN_START + TURN + 12], [0, 1], clamp);
  const goalPop = spring({
    frame: frame - (SHOT_START + SHOT),
    fps,
    config: { damping: 11, mass: 0.6 },
  });
  const labels = interpolate(frame, [SHOT_START + SHOT + 6, SHOT_START + SHOT + 22], [0, 1], clamp);

  const goalAt = turned(g.goal.x, g.goal.y);
  const mouth = turned(120, 40);
  const wedgeLabel = {
    x: goalAt.x + (mouth.x - goalAt.x) * 0.45,
    y: goalAt.y + (mouth.y - goalAt.y) * 0.45,
  };

  return (
    <PostFrame
      eyebrow={`${g.minute + 1}' · Spain 2–1 England`}
      headline={
        <>
          The winner, <span style={{ color: C.orange }}>frozen.</span>
        </>
      }
      sub={`${g.moves.length} actions from Spain's half to the net — and where every player StatsBomb saw was standing when ${surname(g.scorer)} struck it.`}
      credit="StatsBomb open data · Euro 2024 final"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28, alignItems: "center" }}>
        <div style={{ position: "relative", width: WIDTH, height: HEIGHT, overflow: "hidden" }}>
          <div
            style={{
              width: WIDTH,
              height: HEIGHT,
              transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
              transform: `translate(${SHIFT.x * turnT}px, ${SHIFT.y * turnT}px) rotate(${-90 * turnT}deg) scale(${1 + (ZOOM - 1) * turnT})`,
            }}
          >
            <GoalChainChart
              chain={g}
              width={WIDTH}
              showFreezeFrame
              showLabels={false}
              progress={moves + shotT}
              goalPop={frame < SHOT_START + SHOT ? 0 : goalPop}
              chainOpacity={1 - 0.6 * turnT}
              freezeOpacity={freeze}
              angleOpacity={wedge}
            />
          </div>
          <AbsoluteFill style={{ opacity: labels, pointerEvents: "none" }}>
            <Label x={goalAt.x} y={goalAt.y} dx={34} dy={-16} color={C.orange}>
              {surname(g.scorer)} · {g.xg.toFixed(2)} xG
            </Label>
            {angle && (
              <Label x={wedgeLabel.x} y={wedgeLabel.y} dx={-290} dy={-22} color="white">
                {Math.round(angle.angle)}° goal angle
              </Label>
            )}
          </AbsoluteFill>
        </div>
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", justifyContent: "center" }}>
          <Key color="white" label="Pass" />
          <Key color={C.emerald} label="Carry" />
          <Key color={C.spain} label="Spain" />
          <Key color="#e2e8f0" label="England" />
          <Key color={C.orange} label="Keeper · shot" hollow />
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {["<Arrows>", "<Comet>", "<Scatter>", "<GoalAngle>"].map((t) => (
            <Tag key={t} size={22}>
              {t}
            </Tag>
          ))}
        </div>
      </div>
    </PostFrame>
  );
}

/** Text over the pitch, anchored to a pixel position inside the chart box. */
function Label({
  x,
  y,
  dx,
  dy,
  color,
  children,
}: {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x + dx,
        top: y + dy,
        fontFamily: FONT.sans,
        fontSize: 28,
        fontWeight: 700,
        color,
        whiteSpace: "nowrap",
        textShadow: "0 0 6px rgba(6,16,11,0.95), 0 0 2px rgba(6,16,11,1)",
      }}
    >
      {children}
    </div>
  );
}
