"use client";

import { RaceChart } from "@pitchkit/react";

// One team's shots. The area reads cleanly here precisely because there
// is a single series — with two, the washes overlap where the lines cross,
// which is the part of the chart worth reading.
const shots = [
  { minute: 11, xg: 0.068, goal: false },
  { minute: 12, xg: 0.118, goal: false },
  { minute: 27, xg: 0.048, goal: false },
  { minute: 35, xg: 0.027, goal: false },
  { minute: 42, xg: 0.078, goal: false },
  { minute: 46, xg: 0.113, goal: true },
  { minute: 48, xg: 0.246, goal: false },
  { minute: 55, xg: 0.243, goal: false },
  { minute: 66, xg: 0.162, goal: false },
  { minute: 69, xg: 0.033, goal: false },
  { minute: 81, xg: 0.164, goal: false },
  { minute: 86, xg: 0.283, goal: true },
];

/** `appearance.area` shades under each line at ~10% of the series hue. */
export function RaceChartAreaBasic() {
  return (
    <RaceChart
      series={[{ id: "Spain", label: "Spain", data: shots }]}
      time={(s) => s.minute}
      value={(s) => s.xg}
      emphasize={(s) => s.goal}
      appearance={{ area: true, markers: "all" }}
    />
  );
}
