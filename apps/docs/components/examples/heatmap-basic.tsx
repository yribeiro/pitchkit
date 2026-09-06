"use client";

import { Heatmap, Pitch } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80) — a cluster of shots near the box.
const shots = [
  { x: 95, y: 35 },
  { x: 98, y: 40 },
  { x: 101, y: 38 },
  { x: 104, y: 42 },
  { x: 110, y: 39 },
  { x: 108, y: 36 },
  { x: 99, y: 45 },
  { x: 92, y: 44 },
];

/**
 * `<Heatmap>` bins point density onto a canvas. It needs a fixed pixel
 * size, since <canvas> has no server-rendered content to size against —
 * unlike the SVG mark layers above, which are responsive by default.
 */
export function HeatmapBasic() {
  return (
    <Pitch type="statsbomb" width={480} height={320} appearance={docsAppearance}>
      <Heatmap
        data={shots}
        x={(s) => s.x}
        y={(s) => s.y}
        binsX={8}
        binsY={6}
        colorMin="#0f3d24"
        colorMax="#fb923c"
        style={{ opacity: 0.85 }}
      />
    </Pitch>
  );
}
