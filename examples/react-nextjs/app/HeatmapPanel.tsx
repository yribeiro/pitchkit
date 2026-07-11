"use client";

import { useState } from "react";
import { Heatmap, Pitch, Scatter } from "@pitchkit/react";

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

const HEATMAP_COLORMAPS = {
  default: { colorMin: "#1d4ed8", colorMax: "#facc15" },
  pearlEarring: { colorMin: "#15242e", colorMax: "#4393c4" },
  flamingo: { colorMin: "#e3aca7", colorMax: "#c03a1d" },
} as const;
type HeatmapColormapKey = keyof typeof HEATMAP_COLORMAPS;

/**
 * "use client": Heatmap paints to a <canvas> via a client-side effect
 * (there's no server Canvas 2D context), and the colormap select below
 * needs interactive state — both require a client boundary.
 */
export function HeatmapPanel() {
  const [colormap, setColormap] = useState<HeatmapColormapKey>("default");
  const colors = HEATMAP_COLORMAPS[colormap];

  return (
    <section>
      <h2>Client Pitch + Heatmap</h2>
      <p>
        Canvas painting and the colormap picker both need the browser, so this panel opts into a
        client boundary explicitly.
      </p>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.8rem",
          color: "#bbb",
          marginBottom: "0.75rem",
        }}
      >
        Colormap
        <select
          value={colormap}
          onChange={(e) => setColormap(e.target.value as HeatmapColormapKey)}
          style={{
            background: "#111",
            color: "#eee",
            border: "1px solid #444",
            borderRadius: 4,
            padding: "0.15rem 0.3rem",
          }}
        >
          <option value="default">default (blue → yellow)</option>
          <option value="pearlEarring">pearl earring</option>
          <option value="flamingo">flamingo</option>
        </select>
      </label>
      <Pitch type="statsbomb" width={460} height={307}>
        <Heatmap
          data={shots}
          x={(s) => s.x}
          y={(s) => s.y}
          binsX={8}
          binsY={6}
          colorMin={colors.colorMin}
          colorMax={colors.colorMax}
          style={{ opacity: 0.75 }}
        />
        <Scatter data={shots} x={(s) => s.x} y={(s) => s.y} r={2} fill="white" fillOpacity={0.7} />
      </Pitch>
    </section>
  );
}
