"use client";

import { Arrows, Pitch, Scatter } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80).
const pass = { from: { x: 40, y: 60 }, to: { x: 85, y: 30 } };
const shots = [
  { x: 95, y: 35 },
  { x: 101, y: 42 },
  { x: 108, y: 38 },
];

/**
 * For a mark whose JSX you don't own (e.g. inside a shadcn recipe
 * wrapping `<Pitch>`), reach it via the `data-pitchkit-mark` attribute
 * every mark already carries — no `className` prop needed on the mark
 * itself. The trailing `!` is required: these marks never got a
 * `className` to signal an opt-out, so their themed default is still an
 * inline style, which only an `!important` utility can out-rank.
 */
export function TailwindAttributeBasic() {
  return (
    <div className="[&_[data-pitchkit-mark=arrow-head]]:fill-amber-400! [&_[data-pitchkit-mark=arrow-shaft]]:stroke-amber-400! [&_[data-pitchkit-mark=scatter]]:fill-amber-200!">
      <Pitch type="statsbomb" appearance={docsAppearance}>
        <Arrows
          data={[pass]}
          x={(d) => d.from.x}
          y={(d) => d.from.y}
          x2={(d) => d.to.x}
          y2={(d) => d.to.y}
        />
        <Scatter data={shots} x={(d) => d.x} y={(d) => d.y} r={6} />
      </Pitch>
    </div>
  );
}
