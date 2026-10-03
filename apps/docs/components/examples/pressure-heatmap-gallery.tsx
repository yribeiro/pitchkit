"use client";

import { useEffect, useRef, useState } from "react";
import { Heatmap, Pitch } from "@pitchkit/react";
import { docsDensityAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80). Pressure events — where the team wins
// the ball back or forces a rushed pass. Concentrated in midfield and
// pushed toward the opponent's left build-up channel.
const pressures: { x: number; y: number }[] = [
  { x: 52, y: 22 },
  { x: 55, y: 18 },
  { x: 58, y: 25 },
  { x: 61, y: 20 },
  { x: 63, y: 28 },
  { x: 66, y: 23 },
  { x: 57, y: 31 },
  { x: 60, y: 35 },
  { x: 64, y: 33 },
  { x: 68, y: 30 },
  { x: 71, y: 26 },
  { x: 74, y: 22 },
  { x: 54, y: 40 },
  { x: 59, y: 43 },
  { x: 63, y: 41 },
  { x: 67, y: 45 },
  { x: 48, y: 35 },
  { x: 50, y: 28 },
  { x: 45, y: 42 },
  { x: 70, y: 38 },
  { x: 76, y: 32 },
  { x: 79, y: 27 },
  { x: 73, y: 44 },
  { x: 66, y: 52 },
  { x: 61, y: 55 },
  { x: 56, y: 50 },
  { x: 51, y: 58 },
  { x: 47, y: 52 },
  { x: 82, y: 24 },
  { x: 85, y: 30 },
  { x: 42, y: 30 },
  { x: 40, y: 48 },
  { x: 36, y: 38 },
  { x: 88, y: 35 },
  { x: 78, y: 50 },
  { x: 72, y: 60 },
];

const PITCH_ASPECT = 120 / 80;
const FALLBACK_WIDTH = 480;

/**
 * A pressure heatmap on the canvas path: bin counts over a fine grid.
 * `<Heatmap>` paints to a fixed-size canvas, so this measures its own
 * container to stay responsive (the same technique `<Pitch>` uses
 * internally for its SVG).
 */
export function PressureHeatmapGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      <Pitch
        type="statsbomb"
        width={width}
        height={Math.round(width / PITCH_ASPECT)}
        appearance={docsDensityAppearance}
      >
        <Heatmap
          data={pressures}
          x={(p) => p.x}
          y={(p) => p.y}
          binsX={12}
          binsY={8}
          colorMin="#0f3d24"
          colorMax="#38bdf8"
          style={{ opacity: 0.85 }}
        />
      </Pitch>
    </div>
  );
}
