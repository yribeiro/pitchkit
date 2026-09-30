"use client";

import { MomentumChart } from "@pitchkit/react";

// Momentum at whatever interval you have it. The first half is sampled
// every five minutes, the second every two — nothing has to be regular.
// Positive is the home side's pressure, negative the away side's.
const periods = [
  [
    { minute: 0, value: 1.5 },
    { minute: 5, value: 4 },
    { minute: 10, value: 7 },
    { minute: 15, value: 2 },
    { minute: 20, value: -3 },
    { minute: 25, value: -6 },
    { minute: 30, value: -2 },
    { minute: 35, value: 3 },
    { minute: 40, value: 5 },
  ],
  [
    { minute: 45, value: -1 },
    { minute: 47, value: -4 },
    { minute: 49, value: -7 },
    { minute: 51, value: -2 },
    { minute: 53, value: 3 },
    { minute: 55, value: 8 },
    { minute: 57, value: 9 },
    { minute: 59, value: 4 },
    { minute: 61, value: 1 },
    { minute: 63, value: -3 },
    { minute: 65, value: -5 },
    { minute: 67, value: 2 },
    { minute: 69, value: 6 },
    { minute: 71, value: 10 },
    { minute: 73, value: 5 },
    { minute: 75, value: -2 },
    { minute: 77, value: -6 },
    { minute: 79, value: -8 },
    { minute: 81, value: -4 },
    { minute: 83, value: 1 },
    { minute: 85, value: 5 },
    { minute: 87, value: 7 },
    { minute: 89, value: 3 },
  ],
];

// Events are a separate list, with accessors, like the samples.
const events = [
  { minute: 23, side: "away", kind: "goal" },
  { minute: 38, side: "home", kind: "yellow-card" },
  { minute: 56, side: "home", kind: "goal" },
  { minute: 71, side: "away", kind: "red-card" },
  { minute: 81, side: "away", kind: "missed-penalty" },
  { minute: 88, side: "home", kind: "goal" },
] as const;

export function MomentumChartBasic() {
  return (
    <MomentumChart
      periods={periods}
      time={(d) => d.minute}
      value={(d) => d.value}
      teams={{ home: "Home", away: "Away" }}
      events={events}
      eventTime={(e) => e.minute}
      eventSide={(e) => e.side}
      eventKind={(e) => e.kind}
    />
  );
}
