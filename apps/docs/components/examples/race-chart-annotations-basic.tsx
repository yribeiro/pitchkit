"use client";

import { RaceChart, useRaceChart } from "@pitchkit/react";

const shots = [
  { minute: 11, team: "Spain", xg: 0.068, goal: false },
  { minute: 16, team: "England", xg: 0.049, goal: false },
  { minute: 27, team: "Spain", xg: 0.048, goal: false },
  { minute: 45, team: "England", xg: 0.18, goal: false },
  { minute: 46, team: "Spain", xg: 0.113, goal: true },
  { minute: 55, team: "Spain", xg: 0.243, goal: false },
  { minute: 66, team: "Spain", xg: 0.162, goal: false },
  { minute: 70, team: "England", xg: 0.075, goal: false },
  { minute: 72, team: "England", xg: 0.038, goal: true },
  { minute: 86, team: "Spain", xg: 0.283, goal: true },
  { minute: 89, team: "England", xg: 0.117, goal: false },
];

// A booking adds nothing to either running total, so it is not a series.
const bookings = [
  { minute: 24, team: "England", player: "Kane" },
  { minute: 29, team: "Spain", player: "Olmo" },
  { minute: 52, team: "England", player: "Stones" },
];

/**
 * `valueAt(seriesId, minute)` is what puts each card *on* its team's line
 * rather than floating beside it: Stones' 52' yellow sits at whatever
 * England's cumulative xG was at 52'.
 */
function Bookings() {
  const { scaleX, scaleY, valueAt } = useRaceChart();

  return (
    <g>
      {bookings.map((card) => (
        <rect
          key={`${card.team}-${card.minute}`}
          x={scaleX(card.minute) - 3}
          y={scaleY(valueAt(card.team, card.minute)) - 10}
          width={6}
          height={8}
          rx={1}
          style={{
            fill: "var(--pitch-card-yellow, #facc15)",
            // The surface ring keeps it legible where it crosses the line.
            stroke: "var(--pitch-chart-surface)",
            strokeWidth: 1.5,
          }}
        >
          <title>{`${card.player} booked, ${card.minute}'`}</title>
        </rect>
      ))}
    </g>
  );
}

/** Anything that doesn't accumulate is a child, not a series. */
export function RaceChartAnnotationsBasic() {
  return (
    <RaceChart
      series={[
        { id: "Spain", data: shots.filter((s) => s.team === "Spain") },
        { id: "England", data: shots.filter((s) => s.team === "England") },
      ]}
      time={(s) => s.minute}
      value={(s) => s.xg}
      emphasise={(s) => s.goal}
    >
      <Bookings />
    </RaceChart>
  );
}
