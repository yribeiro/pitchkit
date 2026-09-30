"use client";

import { MomentumChart } from "@pitchkit/react";

// Momentum every three minutes in each half. The interval is yours to pick —
// nothing has to be one minute — but use the same one in both halves, or the
// bars come out different widths on either side of half time.
// Positive is the home side's pressure, negative the away side's.
const periods = [
  [
    { minute: 0, value: 2 },
    { minute: 3, value: 5 },
    { minute: 6, value: 8 },
    { minute: 9, value: 4 },
    { minute: 12, value: -1 },
    { minute: 15, value: -4 },
    { minute: 18, value: -7 },
    { minute: 21, value: -3 },
    { minute: 24, value: 1 },
    { minute: 27, value: 4 },
    { minute: 30, value: 7 },
    { minute: 33, value: 5 },
    { minute: 36, value: 2 },
    { minute: 39, value: -2 },
    { minute: 42, value: -5 },
  ],
  [
    { minute: 45, value: -2 },
    { minute: 48, value: -5 },
    { minute: 51, value: -8 },
    { minute: 54, value: -4 },
    { minute: 57, value: 1 },
    { minute: 60, value: 5 },
    { minute: 63, value: 9 },
    { minute: 66, value: 7 },
    { minute: 69, value: 3 },
    { minute: 72, value: -1 },
    { minute: 75, value: -4 },
    { minute: 78, value: -6 },
    { minute: 81, value: -2 },
    { minute: 84, value: 3 },
    { minute: 87, value: 7 },
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
