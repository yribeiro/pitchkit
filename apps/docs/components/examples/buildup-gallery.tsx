"use client";

import { Annotate, Comet, GoalAngle, Pitch, Scatter } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80). A single goal-scoring move: carries as
// comet trails, touches as markers, phases annotated.
const carries = [
  { from: { x: 8, y: 40 }, to: { x: 26, y: 63 } },
  { from: { x: 26, y: 63 }, to: { x: 47, y: 58 } },
  { from: { x: 47, y: 58 }, to: { x: 63, y: 30 } },
  { from: { x: 63, y: 30 }, to: { x: 84, y: 22 } },
  { from: { x: 84, y: 22 }, to: { x: 100, y: 33 } },
  { from: { x: 100, y: 33 }, to: { x: 109, y: 39 } },
];

const touches = [
  { x: 8, y: 40, label: "GK" },
  { x: 26, y: 63, label: "LB" },
  { x: 47, y: 58, label: "CM" },
  { x: 63, y: 30, label: "RW" },
  { x: 84, y: 22, label: "RW" },
  { x: 100, y: 33, label: "ST" },
];

const shot = { x: 109, y: 39 };

/**
 * An annotated build-up: the full move from keeper to goal on one pitch —
 * comets for ball progression, labelled touches, and the shot's goal angle.
 */
export function BuildupGallery() {
  return (
    <Pitch type="statsbomb" appearance={docsAppearance}>
      <GoalAngle data={[shot]} x={(s) => s.x} y={(s) => s.y} fillOpacity={0.16} />
      <Comet
        data={carries}
        x={(c) => c.from.x}
        y={(c) => c.from.y}
        x2={(c) => c.to.x}
        y2={(c) => c.to.y}
        gradient
        endWidth={5}
      />
      <Scatter
        data={touches}
        x={(t) => t.x}
        y={(t) => t.y}
        r={4}
        stroke="white"
        strokeWidth={1.5}
        tooltip={(t) => t.label}
      />
      <Scatter data={[shot]} x={(s) => s.x} y={(s) => s.y} r={6} fill="#fb923c" stroke="white" strokeWidth={2} />
      <Annotate
        data={[{ x: 109, y: 39, label: "Goal · 0.41 xG" }]}
        x={(a) => a.x}
        y={(a) => a.y}
        label={(a) => a.label}
        offsetY={-12}
      />
    </Pitch>
  );
}
