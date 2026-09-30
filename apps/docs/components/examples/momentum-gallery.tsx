"use client";

import { MomentumChart } from "@pitchkit/react";

/**
 * Euro 2024 final, Spain 2–1 England (StatsBomb open data, match 3943043).
 *
 * Momentum is not something StatsBomb publishes. Each value here is derived:
 * on-ball events in the attacking third per minute, Spain minus England,
 * smoothed over three minutes. See the MomentumChart docs for the recipe.
 * Positive is Spain, negative England.
 */
const firstHalf = [
  0.5, 0.3, 0.7, 3.7, 11.0, 16.0, 16.0, 9.7, 4.7, 1.0, 1.0, 2.7, 4.0, 0.7, -1.3, -8.3, -6.0, -3.3,
  8.3, 14.0, 10.3, 7.7, 3.3, -2.3, -5.7, -6.3, 9.3, 8.0, 6.0, -2.7, -1.3, -0.7, 4.7, 7.0, 13.7,
  10.0, 14.0, 8.0, 5.0, 3.3, 2.7, 6.0, 2.0, 0.0, -3.7, -5.0, -3.5,
];

// Second-half minutes carry on from 45, which is how StatsBomb numbers them.
const secondHalf = [
  2.5, 1.0, 5.3, 3.0, -1.0, -11.7, -11.0, -6.3, 2.7, 6.7, 4.0, 1.3, 2.7, -1.7, -6.0, -18.3, -12.0,
  -11.3, -4.7, -3.0, 1.7, 3.7, 9.0, 10.0, 6.0, 0.7, -3.0, -0.7, -7.7, -6.7, -3.0, 7.7, 9.7, 10.3,
  5.7, 16.3, 14.7, 22.7, 14.7, 14.0, 6.0, -0.3, -2.3, -4.7, -2.3, -2.0, -1.0, -0.7, -1.5,
];

const periods = [
  firstHalf.map((value, i) => ({ minute: i, value })),
  secondHalf.map((value, i) => ({ minute: 45 + i, value })),
];

// Goals and bookings only. Substitutions are left out on purpose: eight of
// them in one half would stack into a block, and they are not what this
// chart is about.
const events = [
  { minute: 24.63, side: "away", kind: "yellow-card" },
  { minute: 29.95, side: "home", kind: "yellow-card" },
  { minute: 46.15, side: "home", kind: "goal" },
  { minute: 52.52, side: "away", kind: "yellow-card" },
  { minute: 72.13, side: "away", kind: "goal" },
  { minute: 85.93, side: "home", kind: "goal" },
  { minute: 90.9, side: "away", kind: "yellow-card" },
] as const;

export function MomentumGallery() {
  return (
    // Same black stage as the xG race card, and a 3:2 box so it takes a
    // pitch card's footprint in the grid.
    <div className="pitchkit-chart-stage rounded-md p-2">
      <MomentumChart
        aspectRatio={1.5}
        periods={periods}
        time={(d) => d.minute}
        value={(d) => d.value}
        teams={{ home: "Spain", away: "England" }}
        events={events}
        eventTime={(e) => e.minute}
        eventSide={(e) => e.side}
        eventKind={(e) => e.kind}
      />
    </div>
  );
}
