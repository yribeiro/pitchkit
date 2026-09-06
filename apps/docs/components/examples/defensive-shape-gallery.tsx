"use client";

import { ConvexHull, Pitch, Scatter } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80). Outfield positions for both teams at a
// single defensive-phase frame (keepers excluded, as is conventional —
// they'd stretch each hull back to its own goal).
const home = [
  { id: "LB", x: 38, y: 14 },
  { id: "LCB", x: 32, y: 32 },
  { id: "RCB", x: 32, y: 48 },
  { id: "RB", x: 38, y: 66 },
  { id: "DM", x: 45, y: 40 },
  { id: "LCM", x: 52, y: 26 },
  { id: "RCM", x: 52, y: 54 },
  { id: "LW", x: 64, y: 16 },
  { id: "ST", x: 68, y: 40 },
  { id: "RW", x: 64, y: 64 },
];

const away = [
  { id: "LB", x: 88, y: 66 },
  { id: "LCB", x: 92, y: 50 },
  { id: "RCB", x: 92, y: 30 },
  { id: "RB", x: 88, y: 14 },
  { id: "DM", x: 80, y: 40 },
  { id: "LCM", x: 72, y: 56 },
  { id: "RCM", x: 72, y: 24 },
  { id: "LW", x: 60, y: 70 },
  { id: "ST", x: 56, y: 40 },
  { id: "RW", x: 60, y: 10 },
];

/**
 * Team shape via convex hulls: one hull per team over its outfield
 * positions — compactness and the space between the lines at a glance.
 */
export function DefensiveShapeGallery() {
  return (
    <Pitch type="statsbomb" appearance={docsAppearance}>
      <ConvexHull
        data={home}
        x={(p) => p.x}
        y={(p) => p.y}
        fill="#38bdf8"
        fillOpacity={0.18}
        stroke="#38bdf8"
        strokeWidth={1.5}
      />
      <ConvexHull
        data={away}
        x={(p) => p.x}
        y={(p) => p.y}
        fill="#fb923c"
        fillOpacity={0.18}
        stroke="#fb923c"
        strokeWidth={1.5}
      />
      <Scatter
        data={home}
        x={(p) => p.x}
        y={(p) => p.y}
        r={4}
        fill="#38bdf8"
        stroke="white"
        strokeWidth={1.5}
        tooltip={(p) => `Home ${p.id}`}
      />
      <Scatter
        data={away}
        x={(p) => p.x}
        y={(p) => p.y}
        r={4}
        fill="#fb923c"
        stroke="white"
        strokeWidth={1.5}
        tooltip={(p) => `Away ${p.id}`}
      />
    </Pitch>
  );
}
