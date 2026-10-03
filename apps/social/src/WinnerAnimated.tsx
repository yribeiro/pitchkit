/**
 * Wall post 03 as a video (1080 x 1350): the frame is exactly the static post's
 * — headline, sub, key and tags don't move — and only the markers on the
 * pitch are animated. Spain's build-up to Oyarzabal's winner draws in action
 * by action; just before the shot the horizontal pitch turns to a vertical
 * half pitch and zooms into the goal end, where StatsBomb's 360 positions
 * fade in (outfield players only), then the goal angle and the scorer.
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
const GOAL_START = TURN_START + TURN + 14;
export const WINNER_DURATION = GOAL_START + 90;

/** The 360 frame without the goalkeeper: only the outfield players are plotted. */
const outfield = { ...g, freezeFrame: g.freezeFrame.filter((p) => p.position !== "Goalkeeper") };

const angle = L.stats.goalAngles.find((a) => a.player.includes(surname(g.scorer)));

export function WinnerAnimated() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const moves = interpolate(frame, [START, MOVES_END], [0, N], clamp);
  const turnT = interpolate(frame, [TURN_START, TURN_START + TURN], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const freeze = interpolate(turnT, [0.4, 1], [0, 1], clamp);
  const wedge = interpolate(frame, [TURN_START + TURN, TURN_START + TURN + 12], [0, 1], clamp);
  const goalPop = spring({
    frame: frame - GOAL_START,
    fps,
    config: { damping: 11, mass: 0.6 },
  });
  const labels = interpolate(frame, [GOAL_START + 8, GOAL_START + 24], [0, 1], clamp);

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
              chain={outfield}
              width={WIDTH}
              showFreezeFrame
              showLabels={false}
              progress={moves}
              goalPop={frame < GOAL_START ? 0 : goalPop}
              chainOpacity={1 - turnT}
              freezeOpacity={freeze}
              angleOpacity={wedge}
            />
          </div>
          <div
            style={{
              position: "absolute",
              right: 98,
              bottom: 62,
              opacity: labels,
              textAlign: "right",
              fontFamily: FONT.sans,
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.3,
              textShadow: "0 0 6px rgba(6,16,11,0.95), 0 0 2px rgba(6,16,11,1)",
            }}
          >
            <div style={{ color: C.orange }}>
              {surname(g.scorer)} · {g.xg.toFixed(2)} xG
            </div>
            {angle && <div style={{ color: "white" }}>{Math.round(angle.angle)}° goal angle</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", justifyContent: "center" }}>
          <Key color="white" label="Pass" />
          <Key color={C.emerald} label="Carry" />
          <Key color={C.spain} label="Spain" />
          <Key color="#e2e8f0" label="England" />
          <Key color={C.orange} label="Scorer" />
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
