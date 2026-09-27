"use client";

import { Arrows, Pitch } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

/**
 * Opta event rows, trimmed to what a pass map reads. `typeId` 1 is a pass and
 * `outcome` 1/0 is successful/unsuccessful. In the raw feed a pass's end
 * location lives in qualifiers 140 (x) and 141 (y); it's lifted to
 * `endX`/`endY` here.
 */
interface OptaPass {
  typeId: 1;
  outcome: 0 | 1;
  x: number;
  y: number;
  endX: number;
  endY: number;
}

// Opta coordinates: 0–100 on both axes, origin bottom-left, y pointing up —
// percentages, not metres. `type="opta"` still draws a real 105 x 68 shape.
const passes: OptaPass[] = [
  { typeId: 1, outcome: 1, x: 22.4, y: 18.6, endX: 38.1, endY: 9.7 },
  { typeId: 1, outcome: 1, x: 38.1, y: 9.7, endX: 55.3, endY: 21.4 },
  { typeId: 1, outcome: 1, x: 55.3, y: 21.4, endX: 49.8, endY: 52.6 },
  { typeId: 1, outcome: 1, x: 49.8, y: 52.6, endX: 71.2, endY: 83.5 },
  { typeId: 1, outcome: 0, x: 71.2, y: 83.5, endX: 94.1, endY: 56.3 },
  { typeId: 1, outcome: 1, x: 31.5, y: 64.2, endX: 58.7, endY: 71.9 },
  { typeId: 1, outcome: 1, x: 58.7, y: 71.9, endX: 77.4, endY: 44.0 },
  { typeId: 1, outcome: 0, x: 77.4, y: 44.0, endX: 90.6, endY: 38.2 },
  { typeId: 1, outcome: 1, x: 44.0, y: 38.5, endX: 66.3, endY: 29.1 },
  { typeId: 1, outcome: 0, x: 66.3, y: 29.1, endX: 88.9, endY: 17.4 },
];

const complete = passes.filter((p) => p.outcome === 1);
const incomplete = passes.filter((p) => p.outcome === 0);

/**
 * An Opta pass map on a dark navy analysis board. Successful and
 * unsuccessful passes are separate `<Arrows>` layers, each coloured by its
 * own `stroke-*`/`fill-*` classes — `fill-*` colours the arrowhead, which is
 * a filled polygon.
 */
export function StylingOptaBasic() {
  return (
    <Pitch
      type="opta"
      appearance={docsAppearance}
      className="pitch-surface-slate-900 pitch-stripe-slate-800 pitch-lines-slate-500 pitch-line-width-1"
    >
      <Arrows
        data={incomplete}
        x={(p) => p.x}
        y={(p) => p.y}
        x2={(p) => p.endX}
        y2={(p) => p.endY}
        className="fill-pink-400 stroke-pink-400 opacity-60"
      />
      <Arrows
        data={complete}
        x={(p) => p.x}
        y={(p) => p.y}
        x2={(p) => p.endX}
        y2={(p) => p.endY}
        className="fill-teal-300 stroke-teal-300"
      />
    </Pitch>
  );
}
