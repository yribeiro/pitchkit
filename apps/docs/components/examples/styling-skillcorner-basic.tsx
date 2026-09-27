"use client";

import type {
  SkillCornerBall,
  SkillCornerTrackedPlayer,
} from "@pitchkit/data-providers/skillcorner";
import { Pitch, Scatter } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

/** Just the fields this chart reads, under SkillCorner's own names. */
type Player = Pick<SkillCornerTrackedPlayer, "player_id" | "x" | "y" | "is_detected">;

// SkillCorner coordinates: metres from the centre spot, x along the length,
// y across the width. One 10 fps tracking frame; positions are absolute, so
// they swap ends at half time.
const player_data: Player[] = [
  { player_id: 101, x: -48.6, y: 0.9, is_detected: false },
  { player_id: 102, x: -21.3, y: -18.2, is_detected: true },
  { player_id: 103, x: -24.8, y: -3.1, is_detected: true },
  { player_id: 104, x: -23.9, y: 10.4, is_detected: true },
  { player_id: 105, x: -14.7, y: 26.5, is_detected: true },
  { player_id: 106, x: -8.2, y: -2.6, is_detected: true },
  { player_id: 107, x: 3.5, y: 9.8, is_detected: true },
  { player_id: 108, x: 1.2, y: -14.9, is_detected: true },
  { player_id: 109, x: 14.6, y: -27.3, is_detected: false },
  { player_id: 110, x: 16.8, y: 21.7, is_detected: true },
  { player_id: 111, x: 19.4, y: 1.5, is_detected: true },
  { player_id: 201, x: 49.1, y: -0.4, is_detected: false },
  { player_id: 202, x: 29.6, y: -15.1, is_detected: true },
  { player_id: 203, x: 31.2, y: -2.8, is_detected: true },
  { player_id: 204, x: 30.5, y: 9.3, is_detected: true },
  { player_id: 205, x: 25.8, y: 22.4, is_detected: true },
  { player_id: 206, x: 11.3, y: 4.2, is_detected: true },
  { player_id: 207, x: 8.9, y: -8.7, is_detected: true },
  { player_id: 208, x: 5.7, y: 17.6, is_detected: true },
  { player_id: 209, x: -3.4, y: -21.8, is_detected: false },
  { player_id: 210, x: -1.9, y: 2.3, is_detected: true },
  { player_id: 211, x: -6.1, y: 14.1, is_detected: true },
];
const ball_data: Pick<SkillCornerBall, "x" | "y"> = { x: 3.9, y: 8.6 };

// Tracking rows carry no team. The match file's `players[].team_id` does;
// here the ids are simply split by range.
const home = player_data.filter((p) => p.player_id < 200);
const away = player_data.filter((p) => p.player_id >= 200);

/**
 * A SkillCorner tracking frame in a dark broadcast-tracking look. Players
 * the camera didn't see (`is_detected: false`, an extrapolated position) are
 * drawn as hollow rings — a styling decision that's really a data-honesty
 * one. `dimensions` draws the stadium's real 105 x 68 m pitch.
 */
export function StylingSkillcornerBasic() {
  const detected = (p: Player) => p.is_detected;
  const extrapolated = (p: Player) => !p.is_detected;

  return (
    <Pitch
      type="skillcorner"
      dimensions={{ length: 105, width: 68 }}
      appearance={docsAppearance}
      className="pitch-surface-zinc-950 pitch-stripe-zinc-900 pitch-lines-zinc-600 pitch-line-width-1"
    >
      <Scatter
        data={home.filter(detected)}
        x={(p) => p.x}
        y={(p) => p.y}
        r={5}
        className="fill-sky-400"
      />
      <Scatter
        data={home.filter(extrapolated)}
        x={(p) => p.x}
        y={(p) => p.y}
        r={5}
        strokeWidth={1.5}
        className="fill-transparent stroke-sky-400"
      />
      <Scatter
        data={away.filter(detected)}
        x={(p) => p.x}
        y={(p) => p.y}
        r={5}
        className="fill-rose-500"
      />
      <Scatter
        data={away.filter(extrapolated)}
        x={(p) => p.x}
        y={(p) => p.y}
        r={5}
        strokeWidth={1.5}
        className="fill-transparent stroke-rose-500"
      />
      <Scatter
        data={[ball_data]}
        x={(b) => b.x ?? 0}
        y={(b) => b.y ?? 0}
        r={3.5}
        strokeWidth={1.5}
        className="fill-white stroke-zinc-950"
      />
    </Pitch>
  );
}
