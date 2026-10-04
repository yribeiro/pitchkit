"use client";

import { MomentumChart } from "@pitchkit/react";

// Momentum every three minutes in each half, as one list with every sample
// tagged with its period, the way a feed gives it. The interval is yours to
// pick — nothing has to be one minute — but use the same one in both halves,
// or the bars come out different widths on either side of half time.
// Positive is the home side's pressure, negative the away side's.
const samples = [
  { minute: 0, period: 1, value: 2 },
  { minute: 3, period: 1, value: 5 },
  { minute: 6, period: 1, value: 8 },
  { minute: 9, period: 1, value: 4 },
  { minute: 12, period: 1, value: -1 },
  { minute: 15, period: 1, value: -4 },
  { minute: 18, period: 1, value: -7 },
  { minute: 21, period: 1, value: -3 },
  { minute: 24, period: 1, value: 1 },
  { minute: 27, period: 1, value: 4 },
  { minute: 30, period: 1, value: 7 },
  { minute: 33, period: 1, value: 5 },
  { minute: 36, period: 1, value: 2 },
  { minute: 39, period: 1, value: -2 },
  { minute: 42, period: 1, value: -5 },
  { minute: 45, period: 2, value: -2 },
  { minute: 48, period: 2, value: -5 },
  { minute: 51, period: 2, value: -8 },
  { minute: 54, period: 2, value: -4 },
  { minute: 57, period: 2, value: 1 },
  { minute: 60, period: 2, value: 5 },
  { minute: 63, period: 2, value: 9 },
  { minute: 66, period: 2, value: 7 },
  { minute: 69, period: 2, value: 3 },
  { minute: 72, period: 2, value: -1 },
  { minute: 75, period: 2, value: -4 },
  { minute: 78, period: 2, value: -6 },
  { minute: 81, period: 2, value: -2 },
  { minute: 84, period: 2, value: 3 },
  { minute: 87, period: 2, value: 7 },
];

// Events are a separate list, with accessors, like the samples. Each one
// says which half it's in: minutes restart at 45, so 46' alone could be
// either half's.
const events = [
  { minute: 23, period: 1, side: "away", kind: "goal" },
  { minute: 38, period: 1, side: "home", kind: "yellow-card" },
  { minute: 56, period: 2, side: "home", kind: "goal" },
  { minute: 71, period: 2, side: "away", kind: "red-card" },
  { minute: 81, period: 2, side: "away", kind: "missed-penalty" },
  { minute: 88, period: 2, side: "home", kind: "goal" },
] as const;

export function MomentumChartBasic() {
  return (
    <MomentumChart
      data={samples}
      time={(d) => d.minute}
      period={(d) => d.period}
      value={(d) => d.value}
      teams={{ home: "Home", away: "Away" }}
      events={events}
      eventTime={(e) => e.minute}
      eventPeriod={(e) => e.period}
      eventSide={(e) => e.side}
      eventKind={(e) => e.kind}
    />
  );
}
