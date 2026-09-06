"use client";

import { GoalAngle, Pitch, Scatter } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80). A few shot locations.
const shots = [
  { x: 108, y: 40 },
  { x: 95, y: 55 },
  { x: 102, y: 22 },
];

/** `<GoalAngle>` renders the angle subtended by the goal mouth at each point. */
export function GoalAngleBasic() {
  return (
    <Pitch type="statsbomb" appearance={docsAppearance}>
      <GoalAngle data={shots} x={(s) => s.x} y={(s) => s.y} />
      <Scatter data={shots} x={(s) => s.x} y={(s) => s.y} r={3} />
    </Pitch>
  );
}
