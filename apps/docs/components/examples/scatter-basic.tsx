"use client";

import { Pitch, Scatter } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80).
const players = [
  { name: "GK", x: 12, y: 40 },
  { name: "LB", x: 30, y: 12 },
  { name: "CB", x: 28, y: 40 },
  { name: "RB", x: 30, y: 68 },
  { name: "CM", x: 55, y: 40 },
  { name: "LW", x: 85, y: 15 },
  { name: "ST", x: 95, y: 40 },
  { name: "RW", x: 85, y: 65 },
];

/** `<Scatter>` plots discrete points with per-point styling and hover tooltips. */
export function ScatterBasic() {
  return (
    <Pitch type="statsbomb" appearance={docsAppearance}>
      <Scatter
        data={players}
        x={(p) => p.x}
        y={(p) => p.y}
        r={7}
        stroke="white"
        strokeWidth={2}
        tooltip={(p) => p.name}
      />
    </Pitch>
  );
}
