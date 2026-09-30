import type { MomentumEventKind } from "@pitchkit/react";

/**
 * Euro 2024 final, Spain 2–1 England (StatsBomb open data, match 3943043).
 *
 * StatsBomb publishes no momentum value, so these are derived: on-ball
 * events in the attacking third (x >= 80 for both teams) per minute, Spain
 * minus England, smoothed over three minutes. Positive is Spain.
 */
export const FIRST_HALF = [
  0.5, 0.3, 0.7, 3.7, 11.0, 16.0, 16.0, 9.7, 4.7, 1.0, 1.0, 2.7, 4.0, 0.7, -1.3, -8.3, -6.0, -3.3,
  8.3, 14.0, 10.3, 7.7, 3.3, -2.3, -5.7, -6.3, 9.3, 8.0, 6.0, -2.7, -1.3, -0.7, 4.7, 7.0, 13.7,
  10.0, 14.0, 8.0, 5.0, 3.3, 2.7, 6.0, 2.0, 0.0, -3.7, -5.0, -3.5,
];

/** StatsBomb numbers second-half minutes on from 45. */
export const SECOND_HALF = [
  2.5, 1.0, 5.3, 3.0, -1.0, -11.7, -11.0, -6.3, 2.7, 6.7, 4.0, 1.3, 2.7, -1.7, -6.0, -18.3, -12.0,
  -11.3, -4.7, -3.0, 1.7, 3.7, 9.0, 10.0, 6.0, 0.7, -3.0, -0.7, -7.7, -6.7, -3.0, 7.7, 9.7, 10.3,
  5.7, 16.3, 14.7, 22.7, 14.7, 14.0, 6.0, -0.3, -2.3, -4.7, -2.3, -2.0, -1.0, -0.7, -1.5,
];

export interface FinalEvent {
  minute: number;
  side: "home" | "away";
  kind: MomentumEventKind;
}

/** Goals, bookings and substitutions, so the icon row's stacking can be reviewed. */
export const FINAL_EVENTS: FinalEvent[] = [
  { minute: 24.63, side: "away", kind: "yellow-card" },
  { minute: 29.95, side: "home", kind: "yellow-card" },
  { minute: 45.0, side: "home", kind: "substitution" },
  { minute: 46.15, side: "home", kind: "goal" },
  { minute: 52.52, side: "away", kind: "yellow-card" },
  { minute: 60.68, side: "away", kind: "substitution" },
  { minute: 67.32, side: "home", kind: "substitution" },
  { minute: 69.88, side: "away", kind: "substitution" },
  { minute: 72.13, side: "away", kind: "goal" },
  { minute: 82.63, side: "home", kind: "substitution" },
  { minute: 85.93, side: "home", kind: "goal" },
  { minute: 88.67, side: "home", kind: "substitution" },
  { minute: 89.2, side: "away", kind: "substitution" },
  { minute: 90.9, side: "away", kind: "yellow-card" },
];
