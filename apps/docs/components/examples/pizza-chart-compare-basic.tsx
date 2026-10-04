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
  {
    id: "saka",
    label: "Saka",
    values: { npxg: 61, shots: 63, xa: 56, kp: 72, drib: 88, to: 68, press: 34, ti: 15 },
  },
];

/**
 * Three players on one pizza. Each metric's slice is split into a thin wedge
 * per player, coloured by player, with the group shown as an arc on the rim.
 * Three is the most that stay readable side by side.
 */
export function PizzaChartCompareBasic() {
  return <PizzaChart metrics={metrics} series={players} />;
}
