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

// Euro 2024, per 90. Derived from StatsBomb open data.
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
const saka = {
  npxg: 0.07,
  shots: 1.12,
  xa: 0.05,
  kp: 1.12,
  drib: 1.54,
  to: 2.1,
  press: 9.38,
  ti: 0.56,
};

export function RadarGallery() {
  return (
    // The same theme-aware stage as the other chart cards, in a 3:2 box so
    // it takes a pitch card's footprint in the grid.
    <div className="pitchkit-chart-stage rounded-md p-2">
      <RadarChart
        aspectRatio={1.5}
        metrics={metrics}
        series={[
          { id: "yamal", label: "Lamine Yamal", values: yamal },
          { id: "saka", label: "Bukayo Saka", values: saka },
        ]}
      />
    </div>
  );
}
