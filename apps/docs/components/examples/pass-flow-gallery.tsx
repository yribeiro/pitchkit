"use client";

import { Flow, Pitch } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80). A team's completed passes for one
// half — heavier build-up down the left, direct switches to the right wing.
const passes = [
  { from: { x: 12, y: 40 }, to: { x: 28, y: 30 } },
  { from: { x: 15, y: 35 }, to: { x: 30, y: 22 } },
  { from: { x: 25, y: 18 }, to: { x: 44, y: 14 } },
  { from: { x: 28, y: 24 }, to: { x: 46, y: 20 } },
  { from: { x: 30, y: 15 }, to: { x: 50, y: 12 } },
  { from: { x: 26, y: 20 }, to: { x: 45, y: 25 } },
  { from: { x: 45, y: 18 }, to: { x: 66, y: 14 } },
  { from: { x: 48, y: 22 }, to: { x: 68, y: 18 } },
  { from: { x: 47, y: 15 }, to: { x: 64, y: 24 } },
  { from: { x: 65, y: 16 }, to: { x: 84, y: 20 } },
  { from: { x: 67, y: 20 }, to: { x: 86, y: 14 } },
  { from: { x: 66, y: 24 }, to: { x: 88, y: 28 } },
  { from: { x: 85, y: 18 }, to: { x: 102, y: 30 } },
  { from: { x: 87, y: 24 }, to: { x: 104, y: 34 } },
  { from: { x: 40, y: 45 }, to: { x: 60, y: 50 } },
  { from: { x: 44, y: 52 }, to: { x: 63, y: 58 } },
  { from: { x: 62, y: 55 }, to: { x: 85, y: 62 } },
  { from: { x: 64, y: 60 }, to: { x: 88, y: 66 } },
  { from: { x: 86, y: 64 }, to: { x: 103, y: 52 } },
  { from: { x: 20, y: 55 }, to: { x: 38, y: 62 } },
  { from: { x: 22, y: 60 }, to: { x: 40, y: 66 } },
];

/**
 * A pass-flow map: passes binned by start zone, one arrow per zone showing
 * the average direction, sized and colored by volume — mplsoccer's `flow`.
 */
export function PassFlowGallery() {
  return (
    <Pitch type="statsbomb" appearance={docsAppearance}>
      <Flow
        data={passes}
        x={(p) => p.from.x}
        y={(p) => p.from.y}
        x2={(p) => p.to.x}
        y2={(p) => p.to.y}
        binsX={6}
        binsY={4}
        colorMin="#38bdf8"
        colorMax="#fb923c"
        strokeWidthMin={1.5}
        strokeWidthMax={5}
        tooltip={(bin) => `${bin.count} passes`}
      />
    </Pitch>
  );
}
