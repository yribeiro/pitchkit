"use client";

import { useEffect, useRef, useState } from "react";
import { Heatmap, Pitch, Scatter } from "@pitchkit/react";
import { docsDensityAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80) — a fuller shot map: a dense cluster of
// good chances inside the box, a spread of half-chances around its edge,
// and a few speculative long-range efforts. `xg` stands in for a real
// expected-goals value, weighting the heatmap by shot quality rather than
// raw count.
const shots: { x: number; y: number; xg: number }[] = [
  { x: 108, y: 38, xg: 0.62 },
  { x: 104, y: 42, xg: 0.41 },
  { x: 110, y: 35, xg: 0.55 },
  { x: 106, y: 33, xg: 0.34 },
  { x: 101, y: 45, xg: 0.28 },
  { x: 113, y: 40, xg: 0.71 },
  { x: 98, y: 30, xg: 0.19 },
  { x: 96, y: 48, xg: 0.15 },
  { x: 111, y: 44, xg: 0.48 },
  { x: 103, y: 36, xg: 0.33 },
  { x: 109, y: 41, xg: 0.52 },
  { x: 90, y: 40, xg: 0.12 },
  { x: 88, y: 25, xg: 0.06 },
  { x: 85, y: 55, xg: 0.08 },
  { x: 95, y: 60, xg: 0.09 },
  { x: 99, y: 20, xg: 0.11 },
  { x: 105, y: 50, xg: 0.22 },
  { x: 115, y: 42, xg: 0.58 },
  { x: 78, y: 40, xg: 0.04 },
  { x: 70, y: 38, xg: 0.03 },
];

const PITCH_ASPECT = 120 / 80;
const FALLBACK_WIDTH = 480;

/**
 * `<Heatmap>` bins point density onto a canvas, which needs a fixed pixel
 * size up front — unlike the SVG mark layers on other pages, it can't
 * lean on <Pitch>'s own responsive ResizeObserver. This example measures
 * its own container instead (the same technique <Pitch> uses internally),
 * so the pitch still fills the preview card exactly like every other
 * example rather than sitting at a mismatched fixed size.
 */
export function HeatmapBasic() {
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
          data={shots}
          x={(s) => s.x}
          y={(s) => s.y}
          weight={(s) => s.xg}
          binsX={10}
          binsY={7}
          colorMin="#0f3d24"
          colorMax="#fb923c"
          style={{ opacity: 0.85 }}
        />
        <Scatter data={shots} x={(s) => s.x} y={(s) => s.y} r={2.5} fill="white" fillOpacity={0.7} />
      </Pitch>
    </div>
  );
}
