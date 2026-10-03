"use client";

import { RadarChart } from "@pitchkit/react";

// Per 90 minutes. Each axis runs from the 5th to the 95th percentile of the
// 168 outfield players with 270+ minutes at the tournament, so the rim is
// "top 5%" — StatsBomb's own radar convention. Derived once from StatsBomb
// open data; the chart computes none of it.
const metrics = [
  { id: "npxg", label: "npxG", min: 0, max: 0.34 },
  { id: "shots", label: "Shots", min: 0, max: 3 },
  { id: "xa", label: "xA", min: 0, max: 0.24 },
  { id: "kp", label: "Key passes", min: 0, max: 2.34 },
  { id: "drib", label: "Dribbles", min: 0, max: 2.25 },
  { id: "to", label: "Turnovers", min: 0.04, max: 4.36, lowerIsBetter: true },
  { id: "press", label: "Pressures", min: 4.82, max: 22.2 },
  { id: "ti", label: "Tackles + Int", min: 0.31, max: 2.77 },
];

// Lamine Yamal at Euro 2024, per 90.
const yamal = {
  npxg: 0.28,
  shots: 3.13,
  xa: 0.37,
  kp: 3.13,
  drib: 2.09,
  to: 4.18,
  press: 19.49,
  ti: 1.57,
};

/**
 * One player against the tournament. Turnovers are flipped, so outward is
 * always better; xA is past the 95th percentile, so it is pinned to
 * the rim rather than off the chart.
 */
export function RadarChartBasic() {
  return (
    <RadarChart
      metrics={metrics}
      series={[{ id: "yamal", label: "Lamine Yamal", values: yamal }]}
    />
  );
}
