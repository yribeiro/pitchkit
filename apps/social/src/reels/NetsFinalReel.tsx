/**
 * Reel 06, network cut: the 2022 World Cup final in about 39 seconds. Every
 * player is a numbered disc drifting to their recent average position (the
 * pass-network idea, without the lines) on a pitch tilted so all of it stays
 * in frame. The clock eases into each goal for reel 05's goal view, the
 * build-up and the shot, and the shootout plays out in the goal mouth. The
 * frame around it is shared with the 3D cut (see live/MatchShell.tsx).
 */
import { interpolate } from "remotion";
import { createMatchReel } from "./live/MatchShell";
import { NetsPitch } from "./live/NetsPitch";
import { NETS } from "./live/timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const NETS_DURATION = NETS.DURATION;

export const NetsFinalReel = createMatchReel(NETS, (frame) => (
  <NetsPitch
    T={NETS}
    frame={frame}
    u={frame >= NETS.FRAME.whistle ? NETS.uAt(NETS.FRAME.whistle) : NETS.uAt(frame)}
    win={interpolate(frame, [NETS.CHAMPIONS, NETS.CHAMPIONS + 30], [0, 1], clamp)}
  />
));
