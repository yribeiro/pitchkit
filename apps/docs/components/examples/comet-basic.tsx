"use client";

import { Comet, Pitch } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80). A single dribble, tapering as it moves.
const carries = [
  { from: { x: 40, y: 60 }, to: { x: 58, y: 52 } },
  { from: { x: 58, y: 52 }, to: { x: 76, y: 44 } },
  { from: { x: 76, y: 44 }, to: { x: 94, y: 38 } },
];

/** `<Comet>` draws a tapered, optionally fading trail — good for carries and runs. */
export function CometBasic() {
  return (
    <Pitch type="statsbomb" appearance={docsAppearance}>
      <Comet
        data={carries}
        x={(c) => c.from.x}
        y={(c) => c.from.y}
        x2={(c) => c.to.x}
        y2={(c) => c.to.y}
        gradient
      />
    </Pitch>
  );
}
