"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computePositionalBins, getPitchDimensions } from "@pitchkit/core";
import { Pitch, PositionalHeatmap, usePitch } from "@pitchkit/react";
import { docsDensityAppearance } from "./docs-appearance";

interface Touch {
  x: number;
  y: number;
}

interface ZoneLabel {
  x: number;
  y: number;
  share: string;
}

// StatsBomb coordinates (120 x 80). A possession side's touches across one
// half: heavy circulation through the middle third and the left
// half-space, with the right flank used mostly to switch play.
const touches: Touch[] = [
  { x: 22, y: 40 }, { x: 28, y: 32 }, { x: 26, y: 50 }, { x: 33, y: 24 },
  { x: 35, y: 44 }, { x: 38, y: 58 }, { x: 41, y: 36 }, { x: 44, y: 28 },
  { x: 43, y: 48 }, { x: 47, y: 40 }, { x: 49, y: 20 }, { x: 52, y: 33 },
  { x: 54, y: 52 }, { x: 56, y: 26 }, { x: 58, y: 44 }, { x: 61, y: 38 },
  { x: 62, y: 18 }, { x: 64, y: 56 }, { x: 66, y: 30 }, { x: 68, y: 46 },
  { x: 70, y: 22 }, { x: 71, y: 40 }, { x: 73, y: 60 }, { x: 75, y: 34 },
  { x: 77, y: 50 }, { x: 79, y: 26 }, { x: 81, y: 42 }, { x: 83, y: 16 },
  { x: 85, y: 55 }, { x: 87, y: 36 }, { x: 89, y: 62 }, { x: 91, y: 30 },
  { x: 94, y: 46 }, { x: 96, y: 24 }, { x: 99, y: 40 }, { x: 103, y: 33 },
  { x: 106, y: 48 }, { x: 110, y: 38 }, { x: 30, y: 12 }, { x: 46, y: 68 },
  { x: 59, y: 10 }, { x: 72, y: 70 }, { x: 84, y: 8 }, { x: 92, y: 72 },
];

const dimensions = getPitchDimensions("statsbomb");
const PITCH_ASPECT = 120 / 80;
const FALLBACK_WIDTH = 480;

const LABEL_FONT_SIZE = 10;
const LABEL_HEIGHT = 16;
/** Rough advance width of a digit at LABEL_FONT_SIZE, plus horizontal padding. */
const LABEL_CHAR_WIDTH = 6;
const LABEL_PADDING_X = 6;

/**
 * Zone shares drawn as pill-shaped chips rather than bare `<Annotate>`
 * text: white-on-orange is legible in the hot zones but washes out in the
 * dark ones, and a share printed straight over the penalty spot has a
 * marking running through it. A solid backing plate fixes both, and keeps
 * every label reading identically regardless of the fill underneath.
 *
 * `<Annotate>` emits a bare `<text>`, and SVG text has no background
 * property, so this is `usePitch()` — the documented escape hatch for
 * marks the built-ins don't cover. Chip dimensions stay in pixels because
 * the text they wrap is a fixed pixel size too, so the two scale together.
 */
function ZoneShareLabels({ labels }: { labels: ZoneLabel[] }) {
  const { transform } = usePitch();

  return (
    <g data-pitchkit-layer="zone-share">
      {labels.map((label, i) => {
        const [cx, cy] = transform.toPixel([label.x, label.y]);
        const width = label.share.length * LABEL_CHAR_WIDTH + LABEL_PADDING_X * 2;

        return (
          <g key={i}>
            <rect
              x={cx - width / 2}
              y={cy - LABEL_HEIGHT / 2}
              width={width}
              height={LABEL_HEIGHT}
              rx={LABEL_HEIGHT / 2}
              style={{ fill: "rgba(0, 0, 0, 0.78)" }}
            />
            <text
              x={cx}
              y={cy}
              style={{
                fontSize: LABEL_FONT_SIZE,
                fontWeight: 600,
                textAnchor: "middle",
                dominantBaseline: "central",
                fill: "#ffffff",
              }}
            >
              {label.share}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/**
 * A Juego de Posición occupation map: `<PositionalHeatmap>` for the fill,
 * with each zone's share of total touches labelled at its centre.
 *
 * The labels are the point of this one — core's `computePositionalBins`
 * is the same pure function the layer paints from, so calling it directly
 * gives the identical zones and values to annotate. That's mplsoccer's
 * `label_heatmap` built in userland from public exports, which is exactly
 * where composite recipes belong (PRD §7.4).
 */
export function ZoneOccupationGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);

  const labels = useMemo<ZoneLabel[]>(() => {
    const bins = computePositionalBins(
      { type: "positionalHeatmap", data: touches, x: (t: Touch) => t.x, y: (t: Touch) => t.y },
      dimensions,
    );
    const total = bins.reduce((sum, bin) => sum + bin.value, 0);

    return bins
      .filter((bin) => bin.value > 0)
      .map((bin) => ({
        x: bin.x + bin.width / 2,
        y: bin.y + bin.height / 2,
        share: `${Math.round((bin.value / total) * 100)}%`,
      }));
  }, []);

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
        <PositionalHeatmap
          data={touches}
          x={(t) => t.x}
          y={(t) => t.y}
          colorMin="#0f3d24"
          colorMax="#f97316"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth={1}
          style={{ opacity: 0.85 }}
        />
        <ZoneShareLabels labels={labels} />
      </Pitch>
    </div>
  );
}
