"use client";

import { useEffect, useRef, useState } from "react";
import { Pitch, PositionalHeatmap } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80). A midfielder's touches over a match:
// heaviest through the left half-space and the middle third, thinning out
// in both penalty areas.
const touches: { x: number; y: number }[] = [
  { x: 34, y: 22 },
  { x: 41, y: 18 },
  { x: 45, y: 26 },
  { x: 52, y: 21 },
  { x: 58, y: 30 },
  { x: 63, y: 24 },
  { x: 49, y: 33 },
  { x: 55, y: 38 },
  { x: 61, y: 41 },
  { x: 67, y: 35 },
  { x: 72, y: 28 },
  { x: 78, y: 24 },
  { x: 70, y: 45 },
  { x: 66, y: 52 },
  { x: 59, y: 48 },
  { x: 51, y: 55 },
  { x: 44, y: 44 },
  { x: 38, y: 39 },
  { x: 31, y: 47 },
  { x: 26, y: 40 },
  { x: 82, y: 33 },
  { x: 88, y: 27 },
  { x: 94, y: 31 },
  { x: 86, y: 44 },
  { x: 91, y: 52 },
  { x: 105, y: 38 },
  { x: 110, y: 42 },
  { x: 20, y: 36 },
  { x: 14, y: 41 },
  { x: 47, y: 12 },
  { x: 53, y: 9 },
  { x: 60, y: 66 },
  { x: 68, y: 71 },
  { x: 75, y: 63 },
  { x: 42, y: 60 },
  { x: 36, y: 68 },
  { x: 57, y: 43 },
  { x: 62, y: 37 },
  { x: 50, y: 40 },
  { x: 65, y: 46 },
];

const PITCH_ASPECT = 120 / 80;
const FALLBACK_WIDTH = 480;

/**
 * Like `<Heatmap>`, `<PositionalHeatmap>` paints to a canvas, which needs
 * a fixed pixel size up front — so this example measures its own container
 * (the same technique `<Pitch>` uses internally) rather than leaning on
 * <Pitch>'s responsive mode.
 */
export function PositionalHeatmapBasic() {
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
        appearance={docsAppearance}
      >
        <PositionalHeatmap
          data={touches}
          x={(t) => t.x}
          y={(t) => t.y}
          colorMin="#0f3d24"
          colorMax="#fb923c"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth={1}
          style={{ opacity: 0.85 }}
        />
      </Pitch>
    </div>
  );
}
