"use client";

import { ConvexHull, Pitch, Scatter } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80). A player's touches across a half.
const touches = [
  { x: 40, y: 20 },
  { x: 65, y: 15 },
  { x: 90, y: 25 },
  { x: 95, y: 55 },
  { x: 70, y: 65 },
  { x: 45, y: 50 },
  { x: 68, y: 38 }, // interior
];

/** `<ConvexHull>` renders the convex hull of a point set — good for a player's touch map. */
export function ConvexHullBasic() {
  return (
    <Pitch type="statsbomb" appearance={docsAppearance}>
      <ConvexHull data={touches} x={(t) => t.x} y={(t) => t.y} />
      <Scatter data={touches} x={(t) => t.x} y={(t) => t.y} r={3} />
    </Pitch>
  );
}
