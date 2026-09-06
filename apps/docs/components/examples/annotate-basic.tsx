"use client";

import { Annotate, Pitch } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80).
const zones = [
  { x: 20, y: 40, label: "Defensive third" },
  { x: 60, y: 40, label: "Middle third" },
  { x: 100, y: 40, label: "Attacking third" },
];

/** `<Annotate>` places text labels at pitch coordinates. */
export function AnnotateBasic() {
  return (
    <Pitch type="statsbomb" appearance={docsAppearance}>
      <Annotate data={zones} x={(z) => z.x} y={(z) => z.y} label={(z) => z.label} offsetY={-4} />
    </Pitch>
  );
}
