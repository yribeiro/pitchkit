"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Hexbin, Pitch } from "@pitchkit/react";
import { docsDensityAppearance } from "./docs-appearance";

interface Touch {
  x: number;
  y: number;
}

/**
 * A full match's touches for one side, generated from a fixed seed —
 * hexbin is built for volumes where writing every point out by hand
 * stops being readable, and the seed keeps the docs build deterministic.
 *
 * Three overlapping clusters stand in for a real distribution: a deep
 * build-up base, the midfield hub the team actually plays through, and a
 * final-third overload down the left.
 */
function generateTouches(): Touch[] {
  let seed = 8675309;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const normal = () =>
    Math.sqrt(-2 * Math.log(random() || 1e-9)) * Math.cos(2 * Math.PI * random());
  const round = (value: number) => Math.round(value * 100) / 100;

  const clusters = [
    { count: 180, x: 32, y: 40, spreadX: 14, spreadY: 20 },
    { count: 320, x: 63, y: 38, spreadX: 16, spreadY: 18 },
    { count: 220, x: 92, y: 26, spreadX: 13, spreadY: 14 },
  ];

  return clusters.flatMap((cluster) =>
    Array.from({ length: cluster.count }, () => ({
      x: round(Math.min(119, Math.max(1, cluster.x + normal() * cluster.spreadX))),
      y: round(Math.min(79, Math.max(1, cluster.y + normal() * cluster.spreadY))),
    })),
  );
}

const PITCH_ASPECT = 120 / 80;
const FALLBACK_WIDTH = 480;

/**
 * A full-match touch map on the hexagonal lattice. Hexagons pack evenly
 * in every direction, so at 700+ points the distribution reads as shape
 * rather than as the axis-aligned banding a rectangular grid produces at
 * the same resolution — and empty cells simply aren't drawn, so the
 * unused corners of the pitch stay grass instead of being washed in
 * `colorMin`.
 *
 * Deliberately no scatter layer on top: 700+ SVG circles is exactly the
 * per-element DOM cost the canvas path exists to avoid (docs/architecture.md#rendering-svg-and-canvas), so
 * drawing them here would undercut the point the card is making.
 */
export function TouchMapGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  const touches = useMemo(() => generateTouches(), []);

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
        <Hexbin
          data={touches}
          x={(t) => t.x}
          y={(t) => t.y}
          binsX={20}
          colorMin="#134e4a"
          colorMax="#fde047"
          stroke="rgba(0, 0, 0, 0.3)"
          strokeWidth={0.5}
          style={{ opacity: 0.92 }}
        />
      </Pitch>
    </div>
  );
}
