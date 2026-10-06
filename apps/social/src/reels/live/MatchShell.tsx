/**
 * The frame every cut of reel 06 shares: scoreboard, key-moment captions,
 * the MomentumChart growing behind a playhead, the hook, the champions slam,
 * minutes on top, the comment CTA, the end card and the sound. Each cut
 * brings its own clock (a `Timeline`) and its own pitch.
 */
import type { CSSProperties, ReactNode } from "react";
import { MomentumChart, useMomentumChart } from "@pitchkit/react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EndCard } from "../../components/EndCard";
import { FlagArgentina, FlagFrance } from "../../components/Flags";
import { Mark } from "../../components/Logo";
import { wcFinal as F } from "../../data";
import { C, FONT } from "../../theme";
import { ARG, FRA } from "./scene360";
import type { Timeline } from "./timeline";
import { clockLabel, PERIOD_NAMES, periodMinute, TOP_MINUTES, TOTAL_U } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = Easing.out(Easing.back(2));

const colorOf = (team: string) => (team === F.home ? ARG : FRA);

const big = (size: number, color: string = C.text): CSSProperties => ({
  fontFamily: FONT.display,
  fontSize: size,
  lineHeight: 0.95,
  color,
  letterSpacing: "0.01em",
});

export function createMatchReel(
  T: Timeline,
  pitch: (frame: number) => ReactNode,
  options: { minuteTicks?: boolean } = {},
) {
  const { FRAME, GOALS, KICKS, CHAMPIONS, VALUE_AT, CTA_AT, END_AT, uAt } = T;
  const LIVE_DURATION = T.DURATION;

  /* Scoreboard ------------------------------------------------------------------ */

  function Scoreboard({ frame }: { frame: number }) {
    const { fps } = useVideoConfig();
    const u = uAt(frame);
    const scored = GOALS.filter((g) => frame >= g.frame);
    const pens = KICKS.filter((k) => frame >= k.frame + 7);
    const shootout = frame >= FRAME.whistle;
    const side = (team: string, flag: ReactNode, code: string) => {
      const goals = scored.filter((g) => g.team === team);
      const last = goals.at(-1);
      const bump = last
        ? spring({ frame: frame - last.frame, fps, config: { damping: 8, mass: 0.4 } })
        : 1;
      const kicks = pens.filter((k) => k.team === team);
      return (
        <div style={{ display: "grid", gap: 8, width: 210 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={big(46)}>{code}</span>
            {flag}
          </div>
          <div
            style={{
              ...big(150),
              transform: `scale(${1 + 0.3 * (1 - bump)})`,
              transformOrigin: "left center",
            }}
          >
            {goals.length}
          </div>
          <div style={{ display: "flex", gap: 8, height: 22, opacity: shootout ? 1 : 0 }}>
            {kicks.map((k) => (
              <span
                key={k.player}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: k.scored ? colorOf(team) : "transparent",
                  border: `3px solid ${k.scored ? colorOf(team) : "#ef4444"}`,
                }}
              />
            ))}
          </div>
        </div>
      );
    };
    const { period } = periodMinute(u);
    return (
      <div
        style={{
          position: "absolute",
          top: 196,
          left: 60,
          right: 60,
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        {side(F.home, <FlagArgentina height={40} />, "ARG")}
        {side(F.away, <FlagFrance height={40} />, "FRA")}
        <div
          style={{
            flex: 1,
            textAlign: "center",
            paddingTop: 6,
            fontFamily: FONT.sans,
            fontWeight: 800,
            fontSize: 24,
            lineHeight: 1.35,
          }}
        >
          World Cup final
          <div style={{ fontWeight: 600, color: C.muted, fontSize: 21 }}>Lusail · 18 Dec 2022</div>
        </div>
        <div style={{ width: 200, textAlign: "right" }}>
          <div style={big(104)}>{shootout ? "PENS" : clockLabel(u)}</div>
          <div
            style={{
              fontFamily: FONT.sans,
              fontWeight: 600,
              fontSize: 21,
              color: C.muted,
              marginTop: 8,
            }}
          >
            {shootout ? "Penalty shootout" : PERIOD_NAMES[period - 1]}
          </div>
          <div
            style={{
              marginTop: 10,
              marginLeft: "auto",
              width: 150,
              height: 5,
              borderRadius: 3,
              background: "rgba(255,255,255,0.15)",
            }}
          >
            <div
              style={{
                width: `${(u / TOTAL_U) * 100}%`,
                height: "100%",
                borderRadius: 3,
                background: "#fde047",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  /* Moments --------------------------------------------------------------------- */

  interface Moment {
    at: number;
    hold: number;
    title: string;
    sub?: string;
    color: string;
  }
  const goalTitle = (i: number) => {
    const g = GOALS[i]!;
    return `GOAL · ${g.scorer.toUpperCase()}${g.penalty ? " (PEN)" : ""}`;
  };
  const goalHold = (fast: number) => (T.replay > 0 ? T.replay : fast);
  const MOMENTS: Moment[] = [
    {
      at: FRAME.messi1,
      hold: goalHold(54),
      title: goalTitle(0),
      sub: "Argentina push into France's half",
      color: ARG,
    },
    {
      at: FRAME.diMaria,
      hold: goalHold(54),
      title: goalTitle(1),
      sub: "2–0, and France haven't had a shot",
      color: ARG,
    },
    { at: FRAME.halfTime, hold: 36, title: "HALF-TIME", color: C.text },
    {
      at: FRAME.franceFirst,
      hold: 50,
      title: "FRANCE'S FIRST SHOT",
      sub: "67th minute",
      color: FRA,
    },
    { at: FRAME.mbappe1, hold: goalHold(50), title: goalTitle(2), sub: "2–1", color: FRA },
    {
      at: FRAME.mbappe2,
      hold: goalHold(62),
      title: "MBAPPÉ AGAIN",
      sub: "95 seconds later. 2–2.",
      color: FRA,
    },
    { at: FRAME.extraTime, hold: 40, title: "EXTRA TIME", color: "#fde047" },
    {
      at: FRAME.messi2,
      hold: goalHold(54),
      title: goalTitle(4),
      sub: "3–2, 108th minute",
      color: ARG,
    },
    {
      at: FRAME.mbappe3,
      hold: goalHold(54),
      title: "HAT-TRICK · MBAPPÉ",
      sub: "3–3, 118th minute",
      color: FRA,
    },
    {
      at: FRAME.save,
      hold: goalHold(40),
      title: "SAVED.",
      sub: `${F.theSave.keeper} denies ${F.theSave.player}, 123rd minute`,
      color: C.text,
    },
    { at: FRAME.whistle, hold: 28, title: "PENALTIES", color: "#fde047" },
    ...KICKS.map((k) => ({
      at: k.frame + 6,
      hold: FRAME.kickGap - 2,
      title: `${k.player.toUpperCase()} ${k.scored ? "SCORES" : k.outcome === "Saved" ? "SAVED" : "MISSES"}`,
      color: k.scored ? colorOf(k.team) : "#ef4444",
    })),
  ];

  function MomentCaption({ frame }: { frame: number }) {
    const m = MOMENTS.find((m) => frame >= m.at && frame < m.at + m.hold);
    if (!m) return null;
    const t = interpolate(frame, [m.at, m.at + 7], [0, 1], { ...clamp, easing: pop });
    const out = interpolate(frame, [m.at + m.hold - 6, m.at + m.hold], [1, 0], clamp);
    return (
      <div
        style={{
          position: "absolute",
          // Argentina attack the far (top) end, so their moments caption lower down;
          // in a replay every shot is at the top.
          top: T.replay > 0 ? 1010 : m.color === ARG ? 860 : 520,
          left: 40,
          right: 40,
          textAlign: "center",
          opacity: Math.min(t * 1.4, 1) * out,
          transform: `scale(${0.7 + 0.3 * t})`,
        }}
      >
        <span
          style={{
            ...big(76, m.color),
            display: "inline-block",
            background: "rgba(4,6,12,0.82)",
            borderRadius: 18,
            padding: "12px 26px 14px",
          }}
        >
          {m.title}
        </span>
        {m.sub && (
          <div
            style={{
              fontFamily: FONT.sans,
              fontWeight: 800,
              fontSize: 32,
              marginTop: 12,
              textShadow: "0 3px 16px rgba(0,0,0,0.95)",
            }}
          >
            {m.sub}
          </div>
        )}
      </div>
    );
  }

  /* Momentum strip ----------------------------------------------------------------- */

  /** Hides the part of the chart the clock hasn't reached, and marks the playhead. */
  function Playhead({ u }: { u: number }) {
    const { scaleX, frame } = useMomentumChart();
    const { period, minute } = periodMinute(u);
    const x = scaleX(minute, period);
    return (
      <g>
        <rect
          x={x}
          y={frame.y0 - 2}
          width={frame.width + 100}
          height={frame.height}
          fill="var(--pitch-chart-surface)"
        />
        <line x1={x} x2={x} y1={frame.y0} y2={frame.y1} stroke="#fde047" strokeWidth={1.5} />
      </g>
    );
  }

  const momentumVars = {
    "--pitch-series-1": ARG,
    "--pitch-series-2": FRA,
    "--pitch-chart-surface": "#05060b",
    "--pitch-chart-text": "rgba(238, 245, 241, 0.9)",
    "--pitch-chart-muted": "rgba(238, 245, 241, 0.55)",
    "--pitch-grid": "rgba(255, 255, 255, 0.06)",
    "--pitch-axis": "rgba(255, 255, 255, 0.3)",
  } as CSSProperties;

  function MomentumStrip({ frame }: { frame: number }) {
    const u = frame >= FRAME.whistle ? 9999 : uAt(frame);
    return (
      <div
        style={{
          position: "absolute",
          top: 1270,
          left: 0,
          right: 0,
          padding: "18px 40px 0",
          height: 260,
          background: "#05060b",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: FONT.sans,
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: "0.08em",
            color: C.muted,
            marginBottom: 6,
          }}
        >
          <span>ATTACKING PRESSURE</span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              letterSpacing: "0.02em",
              color: C.text,
            }}
          >
            <Mark size={28} /> pitchkitjs.com
          </span>
        </div>
        <div style={{ ...momentumVars, width: 500, transform: "scale(2)", transformOrigin: "0 0" }}>
          <MomentumChart
            width={500}
            height={104}
            appearance={{ legend: false }}
            data={F.momentum.data}
            period={(d) => d.period}
            time={(d) => d.minute}
            value={(d) => d.value}
            teams={{ home: "Argentina", away: "France" }}
            events={F.momentum.events}
            eventTime={(e) => e.minute}
            eventPeriod={(e) => e.period}
            eventSide={(e) => e.side}
            eventKind={(e) => e.kind}
            eventLabel={(e) => e.label}
          >
            <Playhead u={Math.min(u, TOTAL_U)} />
          </MomentumChart>
        </div>
      </div>
    );
  }

  /* Overlays -------------------------------------------------------------------- */

  function Hook({ frame }: { frame: number }) {
    if (frame > 84) return null;
    const line = (i: number) => {
      const t = interpolate(frame, [-6 + i * 5, 6 + i * 5], [0, 1], {
        ...clamp,
        easing: Easing.out(Easing.cubic),
      });
      return { opacity: t, transform: `translateY(${(1 - t) * 40}px)` };
    };
    const out = interpolate(frame, [70, 84], [1, 0], clamp);
    return (
      <div
        style={{
          position: "absolute",
          top: 880,
          left: 50,
          right: 50,
          textAlign: "center",
          opacity: out,
        }}
      >
        <div style={{ ...big(100), textShadow: "0 8px 40px rgba(0,0,0,0.9)", ...line(0) }}>
          THE GREATEST
        </div>
        <div style={{ ...big(100), textShadow: "0 8px 40px rgba(0,0,0,0.9)", ...line(1) }}>
          FINAL EVER.
        </div>
        <div
          style={{
            ...big(64, "#fde047"),
            marginTop: 18,
            textShadow: "0 6px 30px rgba(0,0,0,0.9)",
            ...line(2),
          }}
        >
          WATCH WHO OWNS THE PITCH
        </div>
      </div>
    );
  }

  function Champions({ frame }: { frame: number }) {
    const { fps } = useVideoConfig();
    if (frame < CHAMPIONS || frame >= VALUE_AT) return null;
    const t = spring({ frame: frame - CHAMPIONS, fps, config: { damping: 10, mass: 0.6 } });
    return (
      <div
        style={{
          position: "absolute",
          top: 560,
          left: 30,
          right: 30,
          textAlign: "center",
          transform: `scale(${1.5 - 0.5 * t})`,
          opacity: Math.min(t * 1.4, 1),
        }}
      >
        <div style={{ ...big(150, ARG), textShadow: "0 8px 40px rgba(0,0,0,0.9)" }}>ARGENTINA</div>
        <div style={{ ...big(92), textShadow: "0 8px 40px rgba(0,0,0,0.9)" }}>WORLD CHAMPIONS</div>
      </div>
    );
  }

  function ValueCard({ frame }: { frame: number }) {
    if (frame < VALUE_AT || frame >= CTA_AT) return null;
    const t = interpolate(frame, [VALUE_AT, VALUE_AT + 10], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    const row = (label: string, minutes: number, color: string, i: number) => {
      const w = interpolate(frame, [VALUE_AT + 8 + i * 6, VALUE_AT + 40 + i * 6], [0, minutes], {
        ...clamp,
        easing: Easing.out(Easing.cubic),
      });
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "150px 1fr 120px",
            alignItems: "center",
            gap: 18,
          }}
        >
          <span style={big(54, color)}>{label}</span>
          <div
            style={{
              height: 34,
              borderRadius: 8,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div style={{ width: `${(w / 90) * 100}%`, height: "100%", background: color }} />
          </div>
          <span style={{ ...big(54), textAlign: "right" }}>{Math.round(w)}'</span>
        </div>
      );
    };
    return (
      <div
        style={{
          position: "absolute",
          top: 500,
          left: 50,
          right: 50,
          opacity: t,
          transform: `translateY(${(1 - t) * 30}px)`,
          background: "rgba(4,6,12,0.88)",
          border: "2px solid rgba(255,255,255,0.1)",
          borderRadius: 28,
          padding: "34px 36px",
          display: "grid",
          gap: 22,
        }}
      >
        <div style={big(64)}>MINUTES ON TOP</div>
        {row("ARG", TOP_MINUTES.home, ARG, 0)}
        {row("FRA", TOP_MINUTES.away, FRA, 1)}
        <div style={{ ...big(64, "#fde047"), marginTop: 6 }}>AND IT STILL WENT TO PENALTIES.</div>
      </div>
    );
  }

  function Cta({ frame }: { frame: number }) {
    const { fps } = useVideoConfig();
    if (frame < CTA_AT || frame >= END_AT) return null;
    const line = (i: number) => {
      const t = spring({
        frame: frame - CTA_AT - 3 - i * 6,
        fps,
        config: { damping: 12, mass: 0.6 },
      });
      return { opacity: Math.min(t * 1.5, 1), transform: `translateY(${(1 - t) * 50}px)` };
    };
    return (
      <AbsoluteFill
        style={{ background: "rgba(3,4,8,0.9)", justifyContent: "center", padding: "0 80px 120px" }}
      >
        <div style={{ ...big(140), ...line(0) }}>WHICH MATCH</div>
        <div style={{ ...big(140, C.accent), ...line(1) }}>SHOULD WE</div>
        <div style={{ ...big(140, C.accent), ...line(2) }}>PLAY BACK</div>
        <div style={{ ...big(140), ...line(3) }}>NEXT?</div>
        <div
          style={{
            fontFamily: FONT.sans,
            fontWeight: 800,
            fontSize: 44,
            marginTop: 36,
            ...line(4),
          }}
        >
          Tell us in the comments ↓
        </div>
      </AbsoluteFill>
    );
  }

  /* Sound ---------------------------------------------------------------------- */

  function cues() {
    const c: { at: number; name: string; volume: number; length: number }[] = [];
    const add = (at: number, name: string, volume: number, length: number) =>
      c.push({ at, name, volume, length });
    // A soft tick for every match minute that passes (the fast cut only).
    let last = options.minuteTicks ? 0 : Infinity;
    for (let f = 0; f < FRAME.whistle; f++) {
      const m = Math.floor(uAt(f));
      if (m > last) {
        last = m;
        add(f, "tick", 0.22, 3);
      }
    }
    for (const g of GOALS) {
      add(g.frame - 8, "whoosh", 0.5, 18);
      add(g.frame + 4, "pop", 1, 14);
    }
    add(FRAME.save - 60, "riser", 0.8, 60);
    add(FRAME.save, "thud", 1, 27);
    add(FRAME.whistle, "whoosh", 0.6, 18);
    for (const k of KICKS) add(k.frame + 6, k.scored ? "pop" : "thud", k.scored ? 0.75 : 0.9, 14);
    add(CHAMPIONS, "thud", 1, 27);
    add(CHAMPIONS, "pop", 1, 14);
    add(VALUE_AT, "whoosh", 0.5, 18);
    for (let i = 0; i < 4; i++) add(CTA_AT + 3 + i * 6, "tick", 0.6, 3);
    add(END_AT, "whoosh", 0.5, 18);
    return c;
  }

  function LiveAudio() {
    return (
      <>
        {cues().map(({ at, name, volume, length }, i) => (
          <Sequence key={i} from={at} durationInFrames={length} layout="none">
            <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
          </Sequence>
        ))}
      </>
    );
  }

  return function MatchReel() {
    const frame = useCurrentFrame();
    return (
      <AbsoluteFill
        style={{
          background: "radial-gradient(120% 70% at 50% 45%, #141022 0%, #05060b 70%)",
          fontFamily: FONT.sans,
          color: C.text,
        }}
      >
        <LiveAudio />
        <div
          style={{
            position: "absolute",
            top: 400,
            left: 0,
            width: 1080,
            height: 870,
            overflow: "hidden",
          }}
        >
          {pitch(frame)}
        </div>
        <Scoreboard frame={frame} />
        <MomentumStrip frame={frame} />
        <Hook frame={frame} />
        <MomentCaption frame={frame} />
        <Champions frame={frame} />
        <ValueCard frame={frame} />
        <Cta frame={frame} />
        <Sequence from={END_AT} durationInFrames={LIVE_DURATION - END_AT}>
          <EndCard />
        </Sequence>
      </AbsoluteFill>
    );
  };
}
