"use client";

import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import { RadarChart, Scatter, VerticalPitch } from "@pitchkit/react";
import type { PolarMetric } from "@pitchkit/react";

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

// His non-penalty shots (StatsBomb coordinates, 120 x 80).
const shots = [
  { x: 106.5, y: 49.9, xg: 0.048, goal: false },
  { x: 108.6, y: 48.3, xg: 0.282, goal: false },
  { x: 91.3, y: 45.4, xg: 0.042, goal: false },
  { x: 103.5, y: 49.7, xg: 0.162, goal: false },
  { x: 107.2, y: 50.2, xg: 0.164, goal: false },
  { x: 93.2, y: 47.1, xg: 0.027, goal: true },
  { x: 97.7, y: 49.9, xg: 0.024, goal: false },
  { x: 100.4, y: 51.7, xg: 0.054, goal: false },
  { x: 98.9, y: 48.6, xg: 0.084, goal: false },
  { x: 89.1, y: 49.3, xg: 0.027, goal: false },
  { x: 94.3, y: 48.5, xg: 0.031, goal: false },
  { x: 92.7, y: 49.6, xg: 0.016, goal: false },
  { x: 99.6, y: 43.0, xg: 0.084, goal: false },
  { x: 101.0, y: 47.7, xg: 0.076, goal: false },
  { x: 104.9, y: 41.5, xg: 0.076, goal: false },
  { x: 114.8, y: 47.3, xg: 0.286, goal: false },
  { x: 107.6, y: 49.0, xg: 0.082, goal: false },
  { x: 97.3, y: 55.7, xg: 0.022, goal: false },
];

// Raw counts per match, for every other metric's breakdown.
const games = [
  {
    opponent: "Croatia",
    npxg: 0.372,
    shots: 3,
    xa: 0.565,
    kp: 3,
    drib: 2,
    to: 2,
    press: 26,
    ti: 1,
  },
  {
    opponent: "England",
    npxg: 0.326,
    shots: 2,
    xa: 0.382,
    kp: 3,
    drib: 0,
    to: 4,
    press: 19,
    ti: 1,
  },
  {
    opponent: "France",
    npxg: 0.105,
    shots: 3,
    xa: 0.242,
    kp: 2,
    drib: 0,
    to: 4,
    press: 12,
    ti: 1,
  },
  {
    opponent: "Germany",
    npxg: 0.112,
    shots: 2,
    xa: 0.389,
    kp: 3,
    drib: 2,
    to: 7,
    press: 13,
    ti: 3,
  },
  {
    opponent: "Georgia",
    npxg: 0.65,
    shots: 7,
    xa: 0.542,
    kp: 6,
    drib: 3,
    to: 2,
    press: 16,
    ti: 1,
  },
  {
    opponent: "Albania",
    npxg: 0,
    shots: 0,
    xa: 0.029,
    kp: 1,
    drib: 1,
    to: 1,
    press: 9,
    ti: 0,
  },
  {
    opponent: "Italy",
    npxg: 0.022,
    shots: 1,
    xa: 0,
    kp: 0,
    drib: 4,
    to: 4,
    press: 17,
    ti: 2,
  },
];

const half = cropForHalf(getPitchDimensions("statsbomb"));

/** What opens in place of the chart. Anything can go here. */
function Detail({ metric }: { metric: PolarMetric }) {
  if (metric.id === "npxg" || metric.id === "shots") {
    return (
      <VerticalPitch type="statsbomb" crop={half} className="mx-auto max-w-xs">
        <Scatter
          data={shots}
          x={(s) => s.x}
          y={(s) => s.y}
          r={(s) => 3 + s.xg * 12}
          fill={(s) => (s.goal ? "var(--pitch-marker-goal)" : "var(--pitch-marker-primary)")}
          stroke="white"
          tooltip={(s) => `xG ${s.xg.toFixed(2)}${s.goal ? " · goal" : ""}`}
        />
      </VerticalPitch>
    );
  }

  const key = metric.id as keyof (typeof games)[number];
  const most = Math.max(1, ...games.map((g) => Number(g[key])));
  return (
    <ul className="space-y-1.5 text-sm">
      {games.map((g) => (
        <li key={g.opponent} className="grid grid-cols-[6rem_1fr_3rem] items-center gap-2">
          <span className="truncate text-fd-muted-foreground">v {g.opponent}</span>
          <span
            className="h-2 rounded-full bg-fd-primary/70"
            style={{ width: `${(Number(g[key]) / most) * 100}%` }}
          />
          <span className="text-right tabular-nums">
            {Number(g[key]).toFixed(metric.id === "xa" ? 2 : 0)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Click an axis label (or focus it and press Enter) to open its breakdown. */
export function RadarChartDetailBasic() {
  return (
    <RadarChart
      metrics={metrics}
      series={[{ id: "yamal", label: "Lamine Yamal", values: yamal }]}
      renderDetail={({ metric }) => <Detail metric={metric} />}
    />
  );
}
