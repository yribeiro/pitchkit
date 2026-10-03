/**
 * Experiment: a football comes out of the horizon spinning, whips past the
 * camera, and a PitchKit pitch takes its place. 1080 x 1920.
 */
import { CameraMotionBlur } from "@remotion/motion-blur";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { GoalChainChart } from "../charts";
import { PostFrame } from "../components/Chrome";
import { oyarzabalGoal } from "../data";
import { BallFlight } from "./BallFlight";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const BALL = 66; // the ball passes the lens here
const REVEAL = BALL + 2;
const DRAW_START = 16; // into the pitch scene
const PER_MOVE = 14;
export const BALL_INTRO_DURATION = REVEAL + DRAW_START + oyarzabalGoal.moves.length * PER_MOVE + 60;

function PitchScene() {
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame,
    [DRAW_START, DRAW_START + oyarzabalGoal.moves.length * PER_MOVE],
    [0, oyarzabalGoal.moves.length],
    clamp,
  );
  const settle = interpolate(frame, [0, 24], [0.94, 1], clamp);
  return (
    <PostFrame
      eyebrow="PitchKit · open source"
      headline={<>Football visualised for the web.</>}
      credit="StatsBomb open data · Euro 2024 final"
    >
      <div
        style={{
          transform: `scale(${settle})`,
          opacity: interpolate(frame, [0, 14], [0, 1], clamp),
        }}
      >
        <GoalChainChart chain={oyarzabalGoal} width={960} progress={progress} showLabels={false} />
      </div>
    </PostFrame>
  );
}

export function BallIntro() {
  const frame = useCurrentFrame();
  // The ball is past the lens by BALL; the grass then fades to black and the
  // pitch scene comes up.
  const sceneOpacity = interpolate(frame, [BALL - 6, BALL + 6], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {frame < BALL + 8 && (
        <AbsoluteFill style={{ opacity: sceneOpacity }}>
          <CameraMotionBlur shutterAngle={200} samples={10}>
            <BallFlight duration={BALL} />
          </CameraMotionBlur>
        </AbsoluteFill>
      )}
      <Sequence from={REVEAL}>
        <PitchScene />
      </Sequence>
    </AbsoluteFill>
  );
}
