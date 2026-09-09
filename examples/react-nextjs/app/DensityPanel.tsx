"use client";

import { useMemo } from "react";
import { Hexbin, KDE, Pitch, PositionalHeatmap, Scatter } from "@pitchkit/react";
import type { PitchAppearance } from "@pitchkit/core";

interface Point {
  x: number;
  y: number;
}

// StatsBomb coordinates (120 x 80). A deterministic stand-in for a match's
// touch data — the density layers only earn their keep at volumes where
// listing every point inline would be unreadable, and a fixed seed keeps
// the review app's output stable between runs.
function generateTouches(count: number): Point[] {
  let seed = 20260909;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  // Box-Muller, so touches cluster around a centre of gravity in the
  // attacking half rather than spreading uniformly across the pitch.
  const normal = () => Math.sqrt(-2 * Math.log(random() || 1e-9)) * Math.cos(2 * Math.PI * random());

  // Rounded to 2dp deliberately: `Math.log`/`Math.cos` are allowed to
  // differ in the last bit between engines, so full-precision coordinates
  // render one `cx` on the server and another in the browser, which React
  // reports as a hydration mismatch.
  const round = (value: number) => Math.round(value * 100) / 100;

  return Array.from({ length: count }, () => ({
    x: round(Math.min(119, Math.max(1, 74 + normal() * 20))),
    y: round(Math.min(79, Math.max(1, 40 + normal() * 16))),
  }));
}

/**
 * The density layers paint an opaque fill over the whole pitch, so these
 * panels turn on `linesOnTop` (mplsoccer's `line_zorder`) to keep the
 * markings visible on top of it.
 */
function withLinesOnTop(appearance: PitchAppearance): PitchAppearance {
  return { ...appearance, linesOnTop: true };
}

interface DensityPanelProps {
  appearance: PitchAppearance;
  colorMin: string;
  colorMax: string;
}

const PITCH_WIDTH = 460;
const PITCH_HEIGHT = 307;

/**
 * "use client" for the same reason HeatmapPanel is: all three of these
 * paint to a <canvas> via a client-side effect, and there's no server
 * Canvas 2D context to render into. They share the heatmap colormap
 * control so the three binning strategies can be compared on the same
 * data and the same colour ramp — which is the point of having them side
 * by side rather than on separate pages.
 */
export function DensityPanel({ appearance, colorMin, colorMax }: DensityPanelProps) {
  const touches = useMemo(() => generateTouches(500), []);
  const pitchAppearance = withLinesOnTop(appearance);

  return (
    <>
      <section>
        <h2>Positional heatmap (Juego de Posición zones)</h2>
        <p>
          Binned by pitch markings rather than a uniform grid — mplsoccer&apos;s{" "}
          <code>bin_statistic_positional</code>.
        </p>
        <Pitch
          type="statsbomb"
          width={PITCH_WIDTH}
          height={PITCH_HEIGHT}
          appearance={pitchAppearance}
        >
          <PositionalHeatmap
            data={touches}
            x={(t) => t.x}
            y={(t) => t.y}
            colorMin={colorMin}
            colorMax={colorMax}
            stroke="rgba(255, 255, 255, 0.35)"
            style={{ opacity: 0.8 }}
          />
        </Pitch>
      </section>

      <section>
        <h2>Hexbin</h2>
        <p>
          The same 500 touches on a hexagonal lattice — empty cells aren&apos;t drawn, so the pitch
          shows through where there was no activity.
        </p>
        <Pitch
          type="statsbomb"
          width={PITCH_WIDTH}
          height={PITCH_HEIGHT}
          appearance={pitchAppearance}
        >
          <Hexbin
            data={touches}
            x={(t) => t.x}
            y={(t) => t.y}
            binsX={16}
            colorMin={colorMin}
            colorMax={colorMax}
            stroke="rgba(0, 0, 0, 0.25)"
            strokeWidth={0.5}
            style={{ opacity: 0.9 }}
          />
        </Pitch>
      </section>

      <section>
        <h2>KDE</h2>
        <p>
          A smooth kernel density surface over a smaller sample, with the individual points drawn on
          top. Density fades to transparent, so there&apos;s no <code>colorMin</code> wash to opt out
          of.
        </p>
        <Pitch
          type="statsbomb"
          width={PITCH_WIDTH}
          height={PITCH_HEIGHT}
          appearance={pitchAppearance}
        >
          <KDE
            data={touches.slice(0, 40)}
            x={(t) => t.x}
            y={(t) => t.y}
            bandwidth={8}
            colorMin={colorMin}
            colorMax={colorMax}
          />
          <Scatter
            data={touches.slice(0, 40)}
            x={(t) => t.x}
            y={(t) => t.y}
            r={1.6}
            fill="white"
            fillOpacity={0.65}
          />
        </Pitch>
      </section>
    </>
  );
}
