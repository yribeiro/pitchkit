/**
 * Reel 06's clocks: which moment of the 2022 World Cup final each video frame
 * shows, for the fast 3D cut (`LIVE`) and the network cut (`NETS`).
 *
 * StatsBomb numbers minutes per period, and they overlap (the second half
 * restarts at 45 while the first ran to 52 with stoppage time), so the reel
 * runs on `u`: minutes played, counted straight through all four periods.
 */
import { Easing, interpolate } from "remotion";
import { wcFinal as F } from "../../data";
import type { WcFinal } from "../../data";

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

/** Video frames (30 fps) pinned to the match's moments. */
export interface Frames {
  messi1: number;
  diMaria: number;
  halfTime: number;
  franceFirst: number;
  mbappe1: number;
  mbappe2: number;
  extraTime: number;
  messi2: number;
  mbappe3: number;
  save: number;
  whistle: number;
  firstKick: number;
  kickGap: number;
}

/** A reel's clock: when each moment plays, and the match time at every frame. */
export interface Timeline {
  FRAME: Frames;
  /** Frames the clock holds on each goal and the save (for a replay), 0 for none. */
  replay: number;
  CHAMPIONS: number;
  VALUE_AT: number;
  CTA_AT: number;
  END_AT: number;
  DURATION: number;
  /** Minutes played at a video frame. */
  uAt: (frame: number) => number;
  GOALS: (WcFinal["goals"][number] & { u: number; frame: number })[];
  KICKS: (WcFinal["kicks"][number] & { frame: number })[];
}

function timeline(
  FRAME: Frames,
  keys: [number, number][],
  options: {
    replay?: number;
    easing?: (t: number) => number;
    /** Frames for the champions slam, the value card, the CTA and the end card. */
    tail?: [number, number, number, number];
  } = {},
): Timeline {
  const [champions, value, cta, end] = options.tail ?? [66, 96, 84, 90];
  const CHAMPIONS = FRAME.firstKick + 7 * FRAME.kickGap + 24;
  const VALUE_AT = CHAMPIONS + champions;
  const CTA_AT = VALUE_AT + value;
  const END_AT = CTA_AT + cta;
  const at = keys.map((k) => k[0]);
  const values = keys.map((k) => k[1]);
  const goalFrames = [
    FRAME.messi1,
    FRAME.diMaria,
    FRAME.mbappe1,
    FRAME.mbappe2,
    FRAME.messi2,
    FRAME.mbappe3,
  ];
  return {
    FRAME,
    replay: options.replay ?? 0,
    CHAMPIONS,
    VALUE_AT,
    CTA_AT,
    END_AT,
    DURATION: END_AT + end,
    uAt: (frame) => interpolate(frame, at, values, { ...clamp, easing: options.easing }),
    GOALS: F.goals.map((g, i) => ({ ...g, u: goalU(i), frame: goalFrames[i]! })),
    KICKS: F.kicks.map((k, i) => ({ ...k, frame: FRAME.firstKick + i * FRAME.kickGap })),
  };
}

// The fast cut: the clock races between moments and slows into each one.
const LIVE_FRAME: Frames = {
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
export const LIVE = timeline(LIVE_FRAME, [
  [0, 0],
  [LIVE_FRAME.messi1 - 24, goalU(0) - 1.2],
  [LIVE_FRAME.messi1, goalU(0)],
  [LIVE_FRAME.messi1 + 18, goalU(0) + 0.4],
  [LIVE_FRAME.diMaria - 24, goalU(1) - 1.2],
  [LIVE_FRAME.diMaria, goalU(1)],
  [LIVE_FRAME.diMaria + 18, goalU(1) + 0.4],
  [LIVE_FRAME.halfTime, uOf(1, PERIODS[0]!.end)],
  [LIVE_FRAME.franceFirst, uOf(2, F.stats.firstFranceShot.clock / 60)],
  [LIVE_FRAME.mbappe1 - 24, goalU(2) - 1.2],
  [LIVE_FRAME.mbappe1, goalU(2)],
  [LIVE_FRAME.mbappe2, goalU(3)],
  [LIVE_FRAME.mbappe2 + 18, goalU(3) + 0.4],
  [LIVE_FRAME.extraTime, uOf(3, PERIODS[2]!.start)],
  [LIVE_FRAME.messi2 - 24, goalU(4) - 1.2],
  [LIVE_FRAME.messi2, goalU(4)],
  [LIVE_FRAME.messi2 + 18, goalU(4) + 0.4],
  [LIVE_FRAME.mbappe3 - 18, goalU(5) - 0.8],
  [LIVE_FRAME.mbappe3, goalU(5)],
  [LIVE_FRAME.mbappe3 + 18, goalU(5) + 0.4],
  [LIVE_FRAME.save - 40, SAVE_U - 0.5],
  [LIVE_FRAME.save, SAVE_U],
  [LIVE_FRAME.save + 14, SAVE_U + 0.05],
  [LIVE_FRAME.whistle, TOTAL_U],
]);

// The network cut: about 36 seconds. The clock eases into each moment and
// holds for a short goal view (the build-up and the shot).
const GOAL_VIEW = 48;
const NETS_FRAME: Frames = {
  messi1: 66,
  diMaria: 150,
  halfTime: 210,
  franceFirst: 255,
  mbappe1: 310,
  mbappe2: 382,
  extraTime: 445,
  messi2: 500,
  mbappe3: 572,
  save: 640,
  whistle: 702,
  firstKick: 716,
  kickGap: 12,
};
const hold = (frame: number, u: number): [number, number][] => [
  [frame, u],
  [frame + GOAL_VIEW, u],
];
export const NETS = timeline(
  NETS_FRAME,
  [
    [0, 0],
    ...hold(NETS_FRAME.messi1, goalU(0)),
    ...hold(NETS_FRAME.diMaria, goalU(1)),
    [NETS_FRAME.halfTime, uOf(1, PERIODS[0]!.end)],
    [NETS_FRAME.franceFirst, uOf(2, F.stats.firstFranceShot.clock / 60)],
    ...hold(NETS_FRAME.mbappe1, goalU(2)),
    ...hold(NETS_FRAME.mbappe2, goalU(3)),
    [NETS_FRAME.extraTime, uOf(3, PERIODS[2]!.start)],
    ...hold(NETS_FRAME.messi2, goalU(4)),
    ...hold(NETS_FRAME.mbappe3, goalU(5)),
    ...hold(NETS_FRAME.save, SAVE_U),
    [NETS_FRAME.whistle, TOTAL_U],
  ],
  { replay: GOAL_VIEW, easing: Easing.inOut(Easing.sin), tail: [54, 78, 66, 75] },
);

/** Minutes each side was on top (momentum above or below zero). */
export const TOP_MINUTES = {
  home: F.momentum.data.filter((d) => d.value > 0).length,
  away: F.momentum.data.filter((d) => d.value < 0).length,
};
