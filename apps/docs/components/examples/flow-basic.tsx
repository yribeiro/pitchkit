"use client";

import { Flow, Pitch } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80). A cluster of passes moving upfield.
const passes = [
  { from: { x: 20, y: 40 }, to: { x: 45, y: 35 } },
  { from: { x: 22, y: 42 }, to: { x: 48, y: 38 } },
  { from: { x: 18, y: 38 }, to: { x: 42, y: 30 } },
  { from: { x: 60, y: 30 }, to: { x: 85, y: 25 } },
  { from: { x: 62, y: 32 }, to: { x: 88, y: 22 } },
  { from: { x: 95, y: 60 }, to: { x: 105, y: 45 } },
];

/** `<Flow>` bins pass data by start location and draws one arrow per bin, sized/colored by volume. */
export function FlowBasic() {
  return (
    <Pitch type="statsbomb" appearance={docsAppearance}>
      <Flow
        data={passes}
        x={(p) => p.from.x}
        y={(p) => p.from.y}
        x2={(p) => p.to.x}
        y2={(p) => p.to.y}
        binsX={8}
        binsY={6}
      />
    </Pitch>
  );
}
