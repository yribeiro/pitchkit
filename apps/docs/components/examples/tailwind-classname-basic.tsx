"use client";

import { Comet, Pitch, Scatter } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80).
const run = { from: { x: 30, y: 20 }, to: { x: 70, y: 55 } };
const shots = [
  { x: 95, y: 35 },
  { x: 101, y: 42 },
  { x: 108, y: 38 },
];

/**
 * `className` reaches a mark you render yourself — but only once the
 * accessor prop it would otherwise fill (`fill`/`stroke`/`color`) is
 * omitted. That prop is applied as inline style, and inline style always
 * beats a class at the same property.
 */
export function TailwindClassnameBasic() {
  return (
    <Pitch type="statsbomb" appearance={docsAppearance}>
      <Comet
        data={[run]}
        x={(d) => d.from.x}
        y={(d) => d.from.y}
        x2={(d) => d.to.x}
        y2={(d) => d.to.y}
        className="fill-fuchsia-400"
      />
      <Scatter
        data={shots}
        x={(d) => d.x}
        y={(d) => d.y}
        r={6}
        strokeWidth={1.5}
        className="fill-cyan-300 stroke-white transition-colors hover:fill-cyan-100"
      />
    </Pitch>
  );
}
