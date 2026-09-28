"use client";

import { RaceChart, useRaceChart } from "@pitchkit/react";

/**
 * Euro 2024 final, Spain 2–1 England (StatsBomb open data, match 3943043).
 * A 2–1 that the chart shows was never close: Spain finish on 1.79 xG from
 * 16 shots, England on 0.73 from 9 — and England's goal came off a 0.038
 * xG shot.
 */
const shots = [
  { minute: 11.22, team: "Spain", xg: 0.068, goal: false, period: 1 },
  { minute: 12.35, team: "Spain", xg: 0.118, goal: false, period: 1 },
  { minute: 16.33, team: "England", xg: 0.049, goal: false, period: 1 },
  { minute: 27.45, team: "Spain", xg: 0.048, goal: false, period: 1 },
  { minute: 34.97, team: "Spain", xg: 0.027, goal: false, period: 1 },
  { minute: 42.4, team: "Spain", xg: 0.078, goal: false, period: 1 },
  { minute: 44.08, team: "England", xg: 0.048, goal: false, period: 1 },
  { minute: 45.68, team: "England", xg: 0.18, goal: false, period: 1 },
  { minute: 46.15, team: "Spain", xg: 0.113, goal: true, period: 2 },
  { minute: 48.32, team: "Spain", xg: 0.246, goal: false, period: 2 },
  { minute: 54.25, team: "Spain", xg: 0.025, goal: false, period: 2 },
  { minute: 54.97, team: "Spain", xg: 0.243, goal: false, period: 2 },
  { minute: 55.38, team: "Spain", xg: 0.049, goal: false, period: 2 },
  { minute: 63.2, team: "England", xg: 0.056, goal: false, period: 2 },
  { minute: 65.75, team: "Spain", xg: 0.162, goal: false, period: 2 },
  { minute: 66.45, team: "Spain", xg: 0.098, goal: false, period: 2 },
  { minute: 69.12, team: "Spain", xg: 0.033, goal: false, period: 2 },
  { minute: 69.98, team: "England", xg: 0.075, goal: false, period: 2 },
  { minute: 71.83, team: "Spain", xg: 0.038, goal: false, period: 2 },
  { minute: 72.13, team: "England", xg: 0.038, goal: true, period: 2 },
  { minute: 81.22, team: "Spain", xg: 0.164, goal: false, period: 2 },
  { minute: 85.93, team: "Spain", xg: 0.283, goal: true, period: 2 },
  { minute: 89.23, team: "England", xg: 0.057, goal: false, period: 2 },
  { minute: 89.25, team: "England", xg: 0.117, goal: false, period: 2 },
  { minute: 89.28, team: "England", xg: 0.106, goal: false, period: 2 },
];

/** Bookings live at `foul_committed.card` in StatsBomb's feed. */
const cards = [
  { minute: 24, team: "England", player: "Kane" },
  { minute: 29, team: "Spain", player: "Olmo" },
  { minute: 52, team: "England", player: "Stones" },
  { minute: 90, team: "England", player: "Watkins" },
];

/**
 * A booking accumulates nothing, so it is not a series — it is a child.
 * `valueAt` is what puts it *on* that team's line rather than floating
 * beside it.
 */
function Bookings() {
  const { scaleX, scaleY, valueAt } = useRaceChart();

  return (
    <g>
      {cards.map((card) => (
        <rect
          key={`${card.team}-${card.minute}`}
          x={scaleX(card.minute) - 3}
          y={scaleY(valueAt(card.team, card.minute)) - 10}
          width={6}
          height={8}
          rx={1}
          style={{
            fill: "var(--pitch-card-yellow, #facc15)",
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

export function XgRaceGallery() {
  return (
    // The grass block and a 3:2 box are what make this card sit in the
    // grid as one of the set: a StatsBomb pitch is 120x80, so a pitch card
    // and this one take the same footprint. <RaceChart> paints no
    // background of its own — it is transparent, so a consumer's own
    // surface shows through — which is why the stage is set here rather
    // than in the component.
    <div className="rounded-md p-2" style={{ background: "var(--pitch-surface)" }}>
      <RaceChart
        aspectRatio={1.5}
        series={[
          { id: "Spain", data: shots.filter((s) => s.team === "Spain") },
          { id: "England", data: shots.filter((s) => s.team === "England") },
        ]}
        time={(s) => s.minute}
        value={(s) => s.xg}
        emphasize={(s) => s.goal}
        period={(s) => s.period}
      >
        <Bookings />
      </RaceChart>
    </div>
  );
}
