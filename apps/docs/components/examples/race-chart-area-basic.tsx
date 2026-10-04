"use client";

import { RaceChart } from "@pitchkit/react";

// One team's shots. The area reads cleanly here precisely because there
// is a single series — with two, the washes overlap where the lines cross,
// which is the part of the chart worth reading.
const shots = [
  { minute: 11, period: 1, xg: 0.068, goal: false },
  { minute: 12, period: 1, xg: 0.118, goal: false },
  { minute: 27, period: 1, xg: 0.048, goal: false },
  { minute: 35, period: 1, xg: 0.027, goal: false },
  { minute: 42, period: 1, xg: 0.078, goal: false },
  { minute: 46, period: 2, xg: 0.113, goal: true },
  { minute: 48, period: 2, xg: 0.246, goal: false },
  { minute: 55, period: 2, xg: 0.243, goal: false },
  { minute: 66, period: 2, xg: 0.162, goal: false },
  { minute: 69, period: 2, xg: 0.033, goal: false },
  { minute: 81, period: 2, xg: 0.164, goal: false },
  { minute: 86, period: 2, xg: 0.283, goal: true },
];

/** `appearance.area` shades under each line at ~10% of the series hue. */
export function RaceChartAreaBasic() {
  return (
    <RaceChart
      series={[{ id: "Spain", label: "Spain", data: shots }]}
      time={(s) => s.minute}
      period={(s) => s.period}
      value={(s) => s.xg}
      emphasise={(s) => s.goal}
      appearance={{ area: true, markers: "all" }}
    />
  );
}
