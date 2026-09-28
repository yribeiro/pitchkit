"use client";

import { RaceChart } from "@pitchkit/react";

// Shots from one match, in the shape a provider gives them: a minute, a
// team, an xG, and whether it went in. Nothing is pre-aggregated —
// <RaceChart> does the accumulating.
const shots = [
  { minute: 11, team: "Spain", xg: 0.068, goal: false, period: 1 },
  { minute: 12, team: "Spain", xg: 0.118, goal: false, period: 1 },
  { minute: 16, team: "England", xg: 0.049, goal: false, period: 1 },
  { minute: 27, team: "Spain", xg: 0.048, goal: false, period: 1 },
  { minute: 42, team: "Spain", xg: 0.078, goal: false, period: 1 },
  { minute: 45, team: "England", xg: 0.18, goal: false, period: 1 },
  { minute: 46, team: "Spain", xg: 0.113, goal: true, period: 2 },
  { minute: 48, team: "Spain", xg: 0.246, goal: false, period: 2 },
  { minute: 55, team: "Spain", xg: 0.243, goal: false, period: 2 },
  { minute: 63, team: "England", xg: 0.056, goal: false, period: 2 },
  { minute: 66, team: "Spain", xg: 0.162, goal: false, period: 2 },
  { minute: 70, team: "England", xg: 0.075, goal: false, period: 2 },
  { minute: 72, team: "England", xg: 0.038, goal: true, period: 2 },
  { minute: 81, team: "Spain", xg: 0.164, goal: false, period: 2 },
  { minute: 86, team: "Spain", xg: 0.283, goal: true, period: 2 },
  { minute: 89, team: "England", xg: 0.117, goal: false, period: 2 },
];

/** One step line per team: flat between shots, jumping at each one by its xG. */
export function RaceChartBasic() {
  return (
    <RaceChart
      series={[
        { id: "Spain", data: shots.filter((s) => s.team === "Spain") },
        { id: "England", data: shots.filter((s) => s.team === "England") },
      ]}
      time={(s) => s.minute}
      value={(s) => s.xg}
      emphasize={(s) => s.goal}
      period={(s) => s.period}
    />
  );
}
