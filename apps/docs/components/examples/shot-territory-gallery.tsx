"use client";

import { useEffect, useRef, useState } from "react";
import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import { KDE, Scatter, VerticalPitch } from "@pitchkit/react";
import { docsDensityAppearance } from "./docs-appearance";

interface Shot {
  x: number;
  y: number;
  goal: boolean;
}

// StatsBomb coordinates (120 x 80). A season's shots for one forward:
// a dense cluster in the six-yard-box channel, a spread around the
// penalty spot, and a thin tail of efforts from the box edge.
const shots: Shot[] = [
  { x: 112, y: 40, goal: true },
  { x: 110, y: 37, goal: true },
  { x: 113, y: 43, goal: true },
  { x: 109, y: 41, goal: false },
  { x: 111, y: 35, goal: true },
  { x: 114, y: 39, goal: true },
  { x: 108, y: 44, goal: false },
  { x: 107, y: 38, goal: true },
  { x: 106, y: 42, goal: false },
  { x: 110, y: 46, goal: false },
  { x: 104, y: 36, goal: false },
  { x: 105, y: 45, goal: true },
  { x: 103, y: 40, goal: false },
  { x: 102, y: 33, goal: false },
  { x: 101, y: 47, goal: false },
  { x: 100, y: 39, goal: false },
  { x: 99, y: 44, goal: false },
  { x: 98, y: 31, goal: false },
  { x: 97, y: 49, goal: false },
  { x: 96, y: 41, goal: false },
  { x: 94, y: 36, goal: false },
  { x: 93, y: 52, goal: false },
  { x: 91, y: 28, goal: false },
  { x: 89, y: 44, goal: false },
  { x: 87, y: 38, goal: false },
  { x: 84, y: 55, goal: false },
  { x: 82, y: 30, goal: false },
  { x: 79, y: 42, goal: false },
];

const dimensions = getPitchDimensions("statsbomb");
const half = cropForHalf(dimensions);
// Vertical framing of the attacking half: the crop's own extents, swapped,
// since orientation maps the pitch's length onto the display's height.
const CROP_ASPECT = Math.abs(half.y1 - half.y0) / Math.abs(half.x1 - half.x0);
const FALLBACK_WIDTH = 360;

/**
 * Shot territory: where this forward's chances actually come from, as a
 * continuous surface rather than a bin count. A KDE is the right tool
 * when the question is "what shape is this player's shooting profile" —
 * 28 shots would leave most cells of a histogram empty, but the kernel
 * spreads each one over its neighbourhood so the underlying tendency is
 * legible.
 *
 * `bandwidth` is set explicitly rather than left to Silverman's rule: the
 * data's own spread includes the long tail of efforts from distance,
 * which over-smooths the six-yard cluster that matters most.
 *
 * The cropped, vertical framing also puts the canvas path through the
 * same transform the SVG marks use — crop and orientation included.
 */
export function ShotTerritoryGallery() {
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
      <VerticalPitch
        type="statsbomb"
        width={width}
        height={Math.round(width / CROP_ASPECT)}
        crop={half}
        appearance={docsDensityAppearance}
      >
        <KDE
          data={shots}
          x={(s) => s.x}
          y={(s) => s.y}
          bandwidth={5}
          resolution={96}
          colorMin="#fde047"
          colorMax="#b91c1c"
          maxOpacity={0.8}
        />
        <Scatter
          data={shots}
          x={(s) => s.x}
          y={(s) => s.y}
          r={(s) => (s.goal ? 1.9 : 1.2)}
          fill={(s) => (s.goal ? "white" : "rgba(255, 255, 255, 0.55)")}
          stroke={(s) => (s.goal ? "rgba(0, 0, 0, 0.6)" : "none")}
          strokeWidth={0.4}
        />
      </VerticalPitch>
    </div>
  );
}
