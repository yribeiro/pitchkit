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

// Lamine Yamal at Euro 2024.
const yamal = { npxg: 91, shots: 96, xa: 100, kp: 99, drib: 93, to: 93, press: 91, ti: 69 };

/**
 * One player, coloured by group: attacking, possession and defending take
 * the first three series colours in order. The tinted part of each slice is
 * the rest of the way to the 100th percentile.
 */
export function PizzaChartBasic() {
  return (
    <PizzaChart
      metrics={metrics}
      series={[{ id: "yamal", label: "Lamine Yamal", values: yamal }]}
    />
  );
}
