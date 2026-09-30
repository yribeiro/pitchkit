/**
 * The Euro 2024 final, Spain 2-1 England (StatsBomb open data, match
 * 3943043), read straight from the events feed and inlined.
 *
 * Inlined rather than fetched because this app exists to verify SSR: a
 * network call would make the server render depend on GitHub being up,
 * and a chart that renders empty on the server tells us nothing about
 * whether <RaceChart> server-renders. The docs site does the live-fetch
 * version.
 *
 * Every number here is real. It is also a good demonstration of why the
 * chart is worth having: Spain finish on 1.79 xG from 16 shots, England
 * on 0.73 from 9 -- and England's goal came from a 0.0379 xG shot. The
 * 2-1 scoreline hides all of that.
 */

export interface FinalShot {
  minute: number;
  second: number;
  team: string;
  xg: number;
  goal: boolean;
  period: number;
}

export interface FinalCard {
  minute: number;
  team: string;
  player: string;
}

export const FINAL_SHOTS: FinalShot[] = [
  { minute: 11, second: 13, team: "Spain", xg: 0.068, goal: false, period: 1 },
  { minute: 12, second: 21, team: "Spain", xg: 0.1175, goal: false, period: 1 },
  { minute: 16, second: 20, team: "England", xg: 0.049, goal: false, period: 1 },
  { minute: 27, second: 27, team: "Spain", xg: 0.0481, goal: false, period: 1 },
  { minute: 34, second: 58, team: "Spain", xg: 0.0265, goal: false, period: 1 },
  { minute: 42, second: 24, team: "Spain", xg: 0.0784, goal: false, period: 1 },
  { minute: 44, second: 5, team: "England", xg: 0.0484, goal: false, period: 1 },
  { minute: 45, second: 41, team: "England", xg: 0.1797, goal: false, period: 1 },
  { minute: 46, second: 9, team: "Spain", xg: 0.1125, goal: true, period: 2 },
  { minute: 48, second: 19, team: "Spain", xg: 0.2456, goal: false, period: 2 },
  { minute: 54, second: 15, team: "Spain", xg: 0.0253, goal: false, period: 2 },
  { minute: 54, second: 58, team: "Spain", xg: 0.2431, goal: false, period: 2 },
  { minute: 55, second: 23, team: "Spain", xg: 0.0491, goal: false, period: 2 },
  { minute: 63, second: 12, team: "England", xg: 0.0563, goal: false, period: 2 },
  { minute: 65, second: 45, team: "Spain", xg: 0.1621, goal: false, period: 2 },
  { minute: 66, second: 27, team: "Spain", xg: 0.0979, goal: false, period: 2 },
  { minute: 69, second: 7, team: "Spain", xg: 0.0326, goal: false, period: 2 },
  { minute: 69, second: 59, team: "England", xg: 0.0747, goal: false, period: 2 },
  { minute: 71, second: 50, team: "Spain", xg: 0.0377, goal: false, period: 2 },
  { minute: 72, second: 8, team: "England", xg: 0.0379, goal: true, period: 2 },
  { minute: 81, second: 13, team: "Spain", xg: 0.1639, goal: false, period: 2 },
  { minute: 85, second: 56, team: "Spain", xg: 0.2833, goal: true, period: 2 },
  { minute: 89, second: 14, team: "England", xg: 0.0574, goal: false, period: 2 },
  { minute: 89, second: 15, team: "England", xg: 0.1172, goal: false, period: 2 },
  { minute: 89, second: 17, team: "England", xg: 0.1058, goal: false, period: 2 },
];

/** Bookings live at `foul_committed.card` (and `bad_behaviour.card`). */
export const FINAL_CARDS: FinalCard[] = [
  { minute: 24, team: "England", player: "Kane" },
  { minute: 29, team: "Spain", player: "Carvajal" },
  { minute: 52, team: "England", player: "Stones" },
  { minute: 90, team: "England", player: "Watkins" },
];

export const HOME_TEAM = "Spain";
export const AWAY_TEAM = "England";
