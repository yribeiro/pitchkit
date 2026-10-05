/**
 * Reel 06's clock: which moment of the 2022 World Cup final each video frame
 * shows, and how much of the pitch each team owns at that moment.
 *
 * StatsBomb numbers minutes per period, and they overlap (the second half
 * restarts at 45 while the first ran to 52 with stoppage time), so the reel
 * runs on `u`: minutes played, counted straight through all four periods.
 */
import { interpolate } from "remotion";
import { wcFinal as F } from "../../data";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const PERIODS = [1, 2, 3, 4].map((period) => {
  const rows = F.momentum.data.filter((d) => d.period === period);
  return { period, start: rows[0]!.minute, end: rows.at(-1)!.minute + 1 };
});
const OFFSETS = PERIODS.map((_, i) =>
  PERIODS.slice(0, i).reduce((sum, p) => sum + (p.end - p.start), 0),
);
export const TOTAL_U = OFFSETS.at(-1)! + PERIODS.at(-1)!.end - PERIODS.at(-1)!.start;

/** Minutes played at `minute` of `period`. */
export const uOf = (period: number, minute: number) => {
  const i = period - 1;
  return (
    OFFSETS[i]! +
    Math.min(Math.max(minute - PERIODS[i]!.start, 0), PERIODS[i]!.end - PERIODS[i]!.start)
  );
};
/** Back from minutes played to the period and its own minute. */
export function periodMinute(u: number) {
  for (let i = PERIODS.length - 1; i >= 0; i--) {
    if (u >= OFFSETS[i]!)
      return { period: PERIODS[i]!.period, minute: PERIODS[i]!.start + u - OFFSETS[i]! };
  }
  return { period: 1, minute: 0 };
}

/** Broadcast clock: 23', then 45+4' in stoppage time. */
export function clockLabel(u: number) {
  const { period, minute } = periodMinute(u);
  const cap = [45, 90, 105, 120][period - 1]!;
  const m = Math.floor(minute) + 1;
  return m > cap ? `${cap}+${m - cap}'` : `${m}'`;
}
export const PERIOD_NAMES = [
  "1st half",
  "2nd half",
  "Extra time, 1st half",
  "Extra time, 2nd half",
];

/* The goals, the late save, and the shootout ----------------------------------- */

const goalU = (i: number) => uOf(F.goals[i]!.period, F.goals[i]!.clock / 60);
export const SAVE_U = uOf(4, F.theSave.clock / 60);

// Video frames (30 fps) pinned to moments: the clock runs fast between
// moments and slows into each one.
export const FRAME = {
  messi1: 96,
  diMaria: 186,
  halfTime: 252,
  franceFirst: 318,
  mbappe1: 402,
  mbappe2: 462,
  extraTime: 540,
  messi2: 642,
  mbappe3: 714,
  save: 804,
  whistle: 846,
  firstKick: 876,
  kickGap: 15,
};
export const CHAMPIONS = FRAME.firstKick + 7 * FRAME.kickGap + 24;
export const VALUE_AT = CHAMPIONS + 66;
export const CTA_AT = VALUE_AT + 96;
export const END_AT = CTA_AT + 84;
export const LIVE_DURATION = END_AT + 90;

const KEYS: [number, number][] = [
  [0, 0],
  [FRAME.messi1 - 24, goalU(0) - 1.2],
  [FRAME.messi1, goalU(0)],
  [FRAME.messi1 + 18, goalU(0) + 0.4],
  [FRAME.diMaria - 24, goalU(1) - 1.2],
  [FRAME.diMaria, goalU(1)],
  [FRAME.diMaria + 18, goalU(1) + 0.4],
  [FRAME.halfTime, uOf(1, PERIODS[0]!.end)],
  [FRAME.franceFirst, uOf(2, F.stats.firstFranceShot.clock / 60)],
  [FRAME.mbappe1 - 24, goalU(2) - 1.2],
  [FRAME.mbappe1, goalU(2)],
  [FRAME.mbappe2, goalU(3)],
  [FRAME.mbappe2 + 18, goalU(3) + 0.4],
  [FRAME.extraTime, uOf(3, PERIODS[2]!.start)],
  [FRAME.messi2 - 24, goalU(4) - 1.2],
  [FRAME.messi2, goalU(4)],
  [FRAME.messi2 + 18, goalU(4) + 0.4],
  [FRAME.mbappe3 - 18, goalU(5) - 0.8],
  [FRAME.mbappe3, goalU(5)],
  [FRAME.mbappe3 + 18, goalU(5) + 0.4],
  [FRAME.save - 40, SAVE_U - 0.5],
  [FRAME.save, SAVE_U],
  [FRAME.save + 14, SAVE_U + 0.05],
  [FRAME.whistle, TOTAL_U],
];
/** Minutes played at a video frame. */
export const uAt = (frame: number) =>
  interpolate(
    frame,
    KEYS.map((k) => k[0]),
    KEYS.map((k) => k[1]),
    clamp,
  );

export const GOALS = F.goals.map((g, i) => ({
  ...g,
  u: goalU(i),
  frame: [FRAME.messi1, FRAME.diMaria, FRAME.mbappe1, FRAME.mbappe2, FRAME.messi2, FRAME.mbappe3][
    i
  ]!,
}));

export const KICKS = F.kicks.map((k, i) => ({ ...k, frame: FRAME.firstKick + i * FRAME.kickGap }));

/** Minutes each side was on top (momentum above or below zero). */
export const TOP_MINUTES = {
  home: F.momentum.data.filter((d) => d.value > 0).length,
  away: F.momentum.data.filter((d) => d.value < 0).length,
};
