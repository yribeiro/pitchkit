/**
 * Reel 06, goals cut: every goal of the 2022 World Cup final and the three
 * moves before it, on StatsBomb 360 data, in about 38 seconds. It opens cold
 * on Di María's build-up (Messi, Álvarez, Mac Allister) and cuts away before
 * the shot; then the clock runs on the tilted pitch and, at each goal, the
 * camera flattens to bird's-eye for the build-up and the finish. No save:
 * straight from the hat-trick to penalties. The frame around it is shared
 * with the other reel 06 cuts (see live/MatchShell.tsx).
 */
import { Easing, interpolate } from "remotion";
import { Mark } from "../components/Logo";
import { wcGoals360 } from "../data";
import { C, FONT } from "../theme";
import { GoalsPitch, goalsCutStepCues } from "./live/GoalsPitch";
import { createMatchReel } from "./live/MatchShell";
import { GOAL_LEAD, GOALS_CUT, GOALS_CUT_BEATS } from "./live/timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const T = GOALS_CUT;

export const GOALS_DURATION = T.DURATION;

/** Under each goal's caption: the chain of names, or how the penalty was won. */
const goalSubs = (() => {
  let a = 0;
  let f = 0;
  return wcGoals360.goals.map((g) => {
    if (g.team === "A") a++;
    else f++;
    const score = `${a}–${f}`;
    if (g.penalty) {
      const foul = g.steps.find((s) => s.kind === "foul")!;
      const fouled = g.steps[g.steps.indexOf(foul) - 1]!;
      return foul.foul === "handball"
        ? `${foul.player} handball · ${score}`
        : `${fouled.player} fouled by ${foul.player} · ${score}`;
    }
    const names = g.steps.flatMap((s) => [s.player, s.to]).filter(Boolean) as string[];
    const chain = names.filter((n, i) => n !== names[i - 1]);
    if (chain.at(-1) !== g.scorer) chain.push(g.scorer);
    return `${chain.join(" → ")} · ${score}`;
  });
})();

function Hook(frame: number) {
  const end = GOALS_CUT_BEATS.intro + 8;
  if (frame > end) return null;
  const line = (i: number) => {
    // The headline is up from frame 0; the rest follows a beat apart.
    const t = interpolate(frame, [i * 5 - 5, i * 5 + 1], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    return { opacity: t, transform: `translateY(${(1 - t) * 30}px)` };
  };
  const out = interpolate(frame, [end - 12, end], [1, 0], clamp);
  const text = (size: number, color: string = C.text) => ({
    fontFamily: FONT.display,
    fontSize: size,
    lineHeight: 0.95,
    color,
    textShadow: "0 8px 40px rgba(0,0,0,0.9)",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 110,
        left: 50,
        right: 50,
        textAlign: "center",
        opacity: out,
      }}
    >
      <div style={{ ...text(118), ...line(0) }}>3 PASSES.</div>
      <div style={{ ...text(92, "#fde047"), ...line(1) }}>1 WORLD CUP GOAL.</div>
      <div
        style={{
          ...line(2),
          marginTop: 18,
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          fontFamily: FONT.sans,
          fontWeight: 800,
          fontSize: 26,
          color: C.text,
          background: "rgba(0,0,0,0.75)",
          border: "1px solid rgba(52,211,153,0.35)",
          borderRadius: 999,
          padding: "8px 18px",
        }}
      >
        <Mark size={26} /> Built with PitchKit
      </div>
    </div>
  );
}

export const GoalsFinalReel = createMatchReel(
  T,
  (frame) => (
    <GoalsPitch
      T={T}
      frame={frame}
      u={frame >= T.FRAME.whistle ? T.uAt(T.FRAME.whistle) : T.uAt(frame)}
      win={interpolate(frame, [T.CHAMPIONS, T.CHAMPIONS + 30], [0, 1], clamp)}
    />
  ),
  {
    save: false,
    pauses: false,
    intro: GOALS_CUT_BEATS.intro,
    hook: Hook,
    goalSubs,
    cta: ["DI MARÍA'S", "COUNTER", "OR MBAPPÉ'S", "VOLLEY?"],
    cues: [
      ...goalsCutStepCues(T).map((at) => ({ at, name: "tick", volume: 0.35, length: 3 })),
      ...T.GOALS.map((g) => ({
        at: g.frame - GOAL_LEAD,
        name: "whoosh",
        volume: 0.3,
        length: 18,
      })),
    ],
  },
);
