"use client";

import { useEffect, useRef, useState } from "react";
import { KDE, Pitch, Scatter } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80). Defensive pressure events from one
// half: a high press concentrated around the opposition's left channel,
// with a second, looser cluster in front of the defensive line.
const pressures: { x: number; y: number }[] = [
  { x: 88, y: 22 },
  { x: 92, y: 26 },
  { x: 85, y: 19 },
  { x: 90, y: 31 },
  { x: 96, y: 24 },
  { x: 83, y: 28 },
  { x: 94, y: 18 },
  { x: 87, y: 33 },
  { x: 99, y: 29 },
  { x: 91, y: 15 },
  { x: 45, y: 44 },
  { x: 51, y: 38 },
  { x: 48, y: 52 },
  { x: 55, y: 47 },
  { x: 42, y: 49 },
  { x: 58, y: 41 },
  { x: 50, y: 58 },
  { x: 62, y: 51 },
  { x: 70, y: 62 },
  { x: 75, y: 55 },
];

const PITCH_ASPECT = 120 / 80;
const FALLBACK_WIDTH = 480;

/**
 * `<KDE>` paints to a canvas, which needs a fixed pixel size up front, so
 * this example measures its own container (the same technique `<Pitch>`
 * uses internally) rather than leaning on <Pitch>'s responsive mode.
 */
export function KdeBasic() {
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
        <KDE
          data={pressures}
          x={(p) => p.x}
          y={(p) => p.y}
          bandwidth={7}
          colorMin="#facc15"
          colorMax="#b91c1c"
          maxOpacity={0.85}
        />
        <Scatter
          data={pressures}
          x={(p) => p.x}
          y={(p) => p.y}
          r={1.6}
          fill="white"
          fillOpacity={0.65}
        />
      </Pitch>
    </div>
  );
}
