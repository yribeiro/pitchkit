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

// Euro 2024, per 90.
const players = [
  {
    id: "yamal",
    label: "Yamal",
    values: {
      npxg: 0.28,
      shots: 3.13,
      xa: 0.37,
      kp: 3.13,
      drib: 2.09,
      to: 4.18,
      press: 19.49,
      ti: 1.57,
    },
  },
  {
    id: "williams",
    label: "N. Williams",
    values: {
      npxg: 0.17,
      shots: 2.14,
      xa: 0.22,
      kp: 2.14,
      drib: 2.68,
      to: 3.75,
      press: 18.95,
      ti: 0.36,
    },
  },
  {
    id: "saka",
    label: "Saka",
    values: {
      npxg: 0.07,
      shots: 1.12,
      xa: 0.05,
      kp: 1.12,
      drib: 1.54,
      to: 2.1,
      press: 9.38,
      ti: 0.56,
    },
  },
];

/**
 * Three wingers on one radar. Each takes the next series colour by position,
 * so removing one never repaints the others. Three is the most that stay
 * readable overlaid; past that, draw small multiples.
 */
export function RadarChartCompareBasic() {
  return <RadarChart metrics={metrics} series={players} />;
}
