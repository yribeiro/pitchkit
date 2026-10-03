"use client";

import { PizzaChart } from "@pitchkit/react";

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

const yamal = { npxg: 91, shots: 96, xa: 100, kp: 99, drib: 93, to: 93, press: 91, ti: 69 };

export function PizzaGallery() {
  return (
    // The same theme-aware stage as the other chart cards, in a 3:2 box so
    // it takes a pitch card's footprint in the grid.
    <div className="pitchkit-chart-stage rounded-md p-2">
      <PizzaChart
        aspectRatio={1.5}
        metrics={metrics}
        series={[{ id: "yamal", label: "Lamine Yamal", values: yamal }]}
      />
    </div>
  );
}
