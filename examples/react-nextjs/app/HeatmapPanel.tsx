"use client";

import { Heatmap, Pitch, Scatter } from "@pitchkit/react";
import type { PitchAppearance } from "@pitchkit/core";

interface Shot {
  x: number;
  y: number;
}

// StatsBomb coordinates (120 x 80).
const shots: Shot[] = [
  { x: 95, y: 35 },
  { x: 98, y: 40 },
  { x: 101, y: 38 },
  { x: 104, y: 42 },
  { x: 110, y: 39 },
  { x: 108, y: 36 },
  { x: 99, y: 45 },
  { x: 60, y: 40 },
  { x: 65, y: 35 },
];

interface HeatmapPanelProps {
  appearance: PitchAppearance;
  colorMin: string;
  colorMax: string;
}

/**
 * "use client": Heatmap paints to a <canvas> via a client-side effect —
 * there's no server Canvas 2D context to render into.
 */
export function HeatmapPanel({ appearance, colorMin, colorMax }: HeatmapPanelProps) {
  return (
    <section>
      <h2>Client Pitch + Heatmap</h2>
      <p>Canvas painting needs the browser, so this panel is client-only for its content.</p>
      <Pitch type="statsbomb" width={460} height={307} appearance={appearance}>
        <Heatmap
          data={shots}
          x={(s) => s.x}
          y={(s) => s.y}
          binsX={8}
          binsY={6}
          colorMin={colorMin}
          colorMax={colorMax}
          style={{ opacity: 0.75 }}
        />
        <Scatter data={shots} x={(s) => s.x} y={(s) => s.y} r={2} fill="white" fillOpacity={0.7} />
      </Pitch>
    </section>
  );
}
