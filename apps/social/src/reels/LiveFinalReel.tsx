/**
 * Reel 06, 3D cut: the 2022 World Cup final as a time-lapse of StatsBomb 360
 * data on a diagonal 3D pitch, every visible player a sphere over the space
 * they controlled, inside the shared match frame (see live/MatchShell.tsx).
 * The clock races between moments and slows into each one.
 */
import { Easing, interpolate } from "remotion";
import { createMatchReel } from "./live/MatchShell";
import { Pitch3D } from "./live/Pitch3D";
import { LIVE } from "./live/timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const LIVE_DURATION = LIVE.DURATION;

export const LiveFinalReel = createMatchReel(
  LIVE,
  (frame) => {
    const { FRAME, CHAMPIONS, uAt } = LIVE;
    // From Argentina's end and off to the side, so their attack runs to the
    // top right; the camera drifts the whole time and leans in for the save.
    const azimuth = interpolate(frame, [0, LIVE.DURATION], [-0.95, -0.75]);
    const lean = interpolate(
      frame,
      [FRAME.save - 50, FRAME.save, FRAME.save + 30, FRAME.save + 60],
      [0, 1, 1, 0],
      { ...clamp, easing: Easing.inOut(Easing.cubic) },
    );
    return (
      <Pitch3D
        u={frame >= FRAME.whistle ? uAt(FRAME.whistle) : uAt(frame)}
        width={1080}
        height={870}
        azimuth={azimuth}
        elevation={0.8 - 0.18 * lean}
        distance={262 - 100 * lean}
        // Kolo Muani's chance is at Argentina's end.
        target={[-46 * lean, 0, 0]}
        win={interpolate(frame, [CHAMPIONS, CHAMPIONS + 30], [0, 1], clamp)}
      />
    );
  },
  { minuteTicks: true },
);
