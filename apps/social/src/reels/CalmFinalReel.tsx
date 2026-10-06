/**
 * Reel 06, calm cut: the 2022 World Cup final at the pace of watching a
 * game. Players are tracked through the 360 data and shown at their recent
 * average positions, with the Voronoi built on those, so the shapes drift
 * rather than flicker. The clock eases into each goal and holds while the
 * pitch turns onto the attacking half to replay the shot's own frame. The
 * frame around it is shared with the 3D cut (see live/MatchShell.tsx).
 */
import { interpolate } from "remotion";
import { CalmPitch } from "./live/CalmPitch";
import { createMatchReel } from "./live/MatchShell";
import { CALM } from "./live/timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const CALM_DURATION = CALM.DURATION;

export const CalmFinalReel = createMatchReel(CALM, (frame) => (
  <CalmPitch
    T={CALM}
    frame={frame}
    u={frame >= CALM.FRAME.whistle ? CALM.uAt(CALM.FRAME.whistle) : CALM.uAt(frame)}
    win={interpolate(frame, [CALM.CHAMPIONS, CALM.CHAMPIONS + 30], [0, 1], clamp)}
  />
));
