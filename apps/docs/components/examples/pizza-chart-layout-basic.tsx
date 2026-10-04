"use client";

import { useState } from "react";
import { PizzaChart } from "@pitchkit/react";
import type { PizzaSeriesLayout } from "@pitchkit/react";

// Each value is a percentile: how many of the 168 outfield players with 270+
// minutes at Euro 2024 this player beat on that stat per 90 (0 = fewest,
// 100 = most). Derived once from StatsBomb open data; the chart computes
// none of it. Turnovers are flipped by `lowerIsBetter`, so a long slice is
// always the good one.
const metrics = [
  { id: "npxg", label: "npxG", group: "Attacking" },
  { id: "shots", label: "Shots", group: "Attacking" },
  { id: "xa", label: "xA", group: "Attacking" },
  { id: "kp", label: "Key passes", group: "Attacking" },
  { id: "drib", label: "Dribbles", group: "Possession" },
  { id: "to", label: "Turnovers", group: "Possession", lowerIsBetter: true },
  { id: "press", label: "Pressures", group: "Defending" },
  { id: "ti", label: "Tackles + Int", group: "Defending" },
];

// Euro 2024.
const players = [
  {
    id: "yamal",
    label: "Yamal",
    values: { npxg: 91, shots: 96, xa: 100, kp: 99, drib: 93, to: 93, press: 91, ti: 69 },
  },
  {
    id: "williams",
    label: "N. Williams",
    values: { npxg: 80, shots: 83, xa: 93, kp: 91, drib: 97, to: 89, press: 89, ti: 8 },
  },
];

const layouts: PizzaSeriesLayout[] = ["side-by-side", "overlay"];

/**
 * How two players share a slice. Side by side keeps both fully visible;
 * overlay draws the larger first so the smaller always shows on top, and
 * suits two players only.
 */
export function PizzaChartLayoutBasic() {
  const [layout, setLayout] = useState<PizzaSeriesLayout>("overlay");

  return (
    <div>
      <div className="mb-3 flex gap-2" role="group" aria-label="Series layout">
        {layouts.map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={layout === l}
            onClick={() => setLayout(l)}
            className="rounded-md border border-fd-border px-2.5 py-1 font-mono text-xs aria-pressed:bg-fd-primary/10 aria-pressed:text-fd-primary"
          >
            {l}
          </button>
        ))}
      </div>
      <PizzaChart metrics={metrics} series={players} seriesLayout={layout} />
    </div>
  );
}
