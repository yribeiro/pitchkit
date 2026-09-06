"use client";

import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import { GoalAngle, Scatter, VerticalPitch } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80). One team's shots from a match:
// location, xG, and outcome.
const shots = [
  { x: 112, y: 39, xg: 0.76, outcome: "goal" },
  { x: 105, y: 44, xg: 0.31, outcome: "saved" },
  { x: 108, y: 33, xg: 0.44, outcome: "goal" },
  { x: 99, y: 47, xg: 0.13, outcome: "off target" },
  { x: 102, y: 36, xg: 0.24, outcome: "blocked" },
  { x: 95, y: 40, xg: 0.09, outcome: "saved" },
  { x: 110, y: 46, xg: 0.52, outcome: "saved" },
  { x: 91, y: 29, xg: 0.06, outcome: "off target" },
  { x: 104, y: 26, xg: 0.17, outcome: "blocked" },
  { x: 87, y: 43, xg: 0.05, outcome: "off target" },
  { x: 107, y: 41, xg: 0.38, outcome: "saved" },
  { x: 97, y: 55, xg: 0.08, outcome: "blocked" },
];

const bestChance = shots.reduce((a, b) => (b.xg > a.xg ? b : a));

const dimensions = getPitchDimensions("statsbomb");

/**
 * A shot map: attacking half, vertical framing, markers sized by xG and
 * colored by outcome, with the goal angle drawn for the best chance.
 */
export function ShotMapGallery() {
  return (
    <VerticalPitch type="statsbomb" appearance={docsAppearance} crop={cropForHalf(dimensions)}>
      <GoalAngle
        data={[bestChance]}
        x={(s) => s.x}
        y={(s) => s.y}
        fillOpacity={0.12}
        stroke="rgba(255, 255, 255, 0.35)"
      />
      <Scatter
        data={shots}
        x={(s) => s.x}
        y={(s) => s.y}
        r={(s) => 3 + s.xg * 9}
        fill={(s) => (s.outcome === "goal" ? "#fb923c" : "#38bdf8")}
        fillOpacity={(s) => (s.outcome === "goal" ? 0.95 : 0.65)}
        stroke="white"
        strokeWidth={(s) => (s.outcome === "goal" ? 2 : 1)}
        tooltip={(s) => `${s.outcome} · xG ${s.xg.toFixed(2)}`}
      />
    </VerticalPitch>
  );
}
