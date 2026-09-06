"use client";

import { Arrows, Pitch } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80).
const passes = [
  { from: { x: 12, y: 40 }, to: { x: 30, y: 12 } },
  { from: { x: 30, y: 12 }, to: { x: 55, y: 40 } },
  { from: { x: 55, y: 40 }, to: { x: 85, y: 15 } },
  { from: { x: 85, y: 15 }, to: { x: 95, y: 40 } },
];

/** `<Arrows>` draws a directional pass/carry map from `x,y` to `x2,y2`. */
export function ArrowsBasic() {
  return (
    <Pitch type="statsbomb" appearance={docsAppearance}>
      <Arrows
        data={passes}
        x={(p) => p.from.x}
        y={(p) => p.from.y}
        x2={(p) => p.to.x}
        y2={(p) => p.to.y}
        strokeWidth={2}
        strokeOpacity={0.85}
      />
    </Pitch>
  );
}
