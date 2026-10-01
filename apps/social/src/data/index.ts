/**
 * Typed views over the committed JSON snapshots in this folder. Regenerate
 * them with `npm run snapshot` (see scripts/snapshot.mjs).
 */
import finalGoalsJson from "./final-goals.json";
import finalMetaJson from "./final-meta.json";
import finalShotsJson from "./final-shots.json";
import layersReelJson from "./layers-reel.json";
import skillcornerGoalJson from "./skillcorner-goal.json";
import spainCarriesJson from "./spain-carries.json";
import spainNetworkJson from "./spain-pass-network.json";
import spainPassesJson from "./spain-passes.json";
import yamalTouchesJson from "./yamal-touches.json";

export interface Point {
  x: number;
  y: number;
}
export interface Segment extends Point {
  endX: number;
  endY: number;
}

export interface Shot extends Segment {
  team: string;
  player: string;
  minute: number;
  xg: number;
  outcome: string;
  goal: boolean;
}

export interface Move extends Segment {
  kind: "pass" | "carry";
  player: string;
  second: number;
}

export interface FreezeFramePlayer extends Point {
  teammate: boolean;
  player: string;
  position: string;
}

export interface GoalChain {
  team: string;
  scorer: string;
  minute: number;
  xg: number;
  goal: Segment & { second: number };
  moves: Move[];
  freezeFrame: FreezeFramePlayer[];
}

export interface NetworkNode extends Point {
  id: number;
  name: string;
  label: string;
  jersey: number;
  position: string;
  touches: number;
}
export interface NetworkEdge {
  from: number;
  to: number;
  count: number;
}

export interface Pass extends Segment {
  complete: boolean;
  player: string;
}

/** One tracked player: `[x, y, isHome, isDetected]`. */
export type TrackedPlayer = [number, number, 0 | 1, 0 | 1];
export interface TrackingFrame {
  frame: number;
  ball: [number, number] | null;
  players: TrackedPlayer[];
}
export interface TrackingClip {
  matchId: number;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  date: string;
  pitchLength: number;
  pitchWidth: number;
  scorer: string;
  scoringTeamIsHome: boolean;
  shotFrame: number;
  period: number;
  frames: TrackingFrame[];
}

export const EURO_FINAL = "Spain 2–1 England · Euro 2024 final";

export const finalMeta = finalMetaJson as { matchId: number; eventCount: number };
export const finalShots = finalShotsJson as Shot[];
export const finalGoals = finalGoalsJson as GoalChain[];
export const spainNetwork = spainNetworkJson as {
  minutes: number;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
};
export const spainPasses = spainPassesJson as Pass[];
export const spainCarries = spainCarriesJson as Segment[];
export const yamalTouches = yamalTouchesJson as Point[];
export const trackingClip = skillcornerGoalJson as TrackingClip;

function goalBy(scorer: string): GoalChain {
  const goal = finalGoals.find((g) => g.scorer.includes(scorer));
  if (!goal) throw new Error(`No goal by ${scorer} in the snapshot`);
  return goal;
}
export const palmerGoal = goalBy("Palmer");
export const oyarzabalGoal = goalBy("Oyarzabal");

/** "Robin Le Normand" → "Le Normand", "Rodri" → "Rodri". */
export const surname = (name: string) => {
  const parts = name.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : name;
};

/** Everything reel 03 plots, plus every number its stat chips show (see scripts/snapshot-layers.mjs). */
export interface LayersReelData {
  stats: {
    shots: { spain: { n: number; xg: number }; england: { n: number; xg: number } };
    keyPasses: { spain: number; england: number; spainAssists: number };
    carries: { spain: number; england: number };
    positions: { n: number; frames: number; pctFinalThird: number; medianX: number };
    pressures: {
      spain: number;
      england: number;
      spainFinalThird: number;
      englandFinalThird: number;
    };
    touches: { yamal: number; williams: number; yamalPctAttHalf: number };
    zone: { spain: { pct: number }; england: { pct: number } };
    direct: { spain: number; england: number };
    voronoi: {
      event: string;
      player: string;
      clock: string;
      secondsBefore: number;
      players: number;
      spainSharePct: number;
      englandSharePct: number;
    };
    shape: {
      spainMeanX: number;
      englandMeanX: number;
      diff: number;
      spainArea: number;
      englandArea: number;
    };
    goalAngles: {
      player: string;
      team: string;
      minute: number;
      x: number;
      y: number;
      angle: number;
      xg: number;
    }[];
  };
  keyArrows: (Segment & { assist: boolean; player: string; minute: number })[];
  carries: Segment[];
  /** Spain players' tracked positions (360), `[x, y]`. */
  positions: [number, number][];
  pressures: Point[];
  yamal: Point[];
  williams: Point[];
  englandFlow: Segment[];
  /** The tracked players in the Voronoi frame (360); `spain` is the acting team. */
  voronoiSites: { x: number; y: number; spain: boolean; actor: boolean; keeper: boolean }[];
  shape: {
    spain: (Point & { label: string })[];
    england: (Point & { label: string })[];
  };
}
export const layersReel = layersReelJson as unknown as LayersReelData;
