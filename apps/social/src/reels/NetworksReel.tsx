/**
 * Reel 04: "283 vs 112". Spain's and England's first-half pass networks in the
 * Euro 2024 final.
 *
 * Hook (0-2.8 s): both finished networks side by side from the first frame,
 * pass counters rolling up underneath — the contrast is the hook. At ~1.3 s
 * the counters lock and the gap slams in, then a punch-in on Spain carries
 * into the first chapter. There the half replays: every disc starts in the
 * starting formation and morphs as each player's average position takes in
 * every touch, settling into the shape the hook showed, while partnerships
 * draw in and thicken. It holds on the
 * strongest link; a whip-pan to England does the same; the outro puts the two
 * finished networks side by side again, so the loop lands back on the hook.
 */
import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Backdrop } from "../components/Chrome";
import { Lockup } from "../components/Logo";
import { passNetworks } from "../data";
import type { TeamNetwork } from "../data";
import { C, FONT } from "../theme";
import { NetworkPitch, networkAt, shapeOf, uprightHeight } from "./NetworkPitch";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);

const SPAIN = passNetworks.spain;
const ENGLAND = passNetworks.england;
const END_MINUTE = Math.max(...[...SPAIN.passes, ...ENGLAND.passes].map((p) => p.t)) + 0.1;
const RATIO = (SPAIN.completed / ENGLAND.completed).toFixed(1);
const SPAIN_SHAPE = shapeOf(SPAIN);
const ENGLAND_SHAPE = shapeOf(ENGLAND);
const LINE_GAP = Math.round(SPAIN_SHAPE.lineHeight - ENGLAND_SHAPE.lineHeight);

// Timeline (30 fps). Each scene overlaps the next by OVERLAP for the transition.
const OVERLAP = 10;
const HOOK = 120;
/** The counters roll up until here, then the gap slams in. */
const COUNT_END = 50;
/** An explainer card between scenes. */
const CARD = 66;
const SECTION = 300;
/** The half replays over these frames of a chapter (7 s), then holds. */
const BUILD_START = 16;
const BUILD_END = 226;
const OUTRO = 150;
const NETWORKS_CARD_AT = HOOK - OVERLAP;
const SPAIN_AT = NETWORKS_CARD_AT + CARD - OVERLAP;
const ENGLAND_AT = SPAIN_AT + SECTION - OVERLAP;
const SHAPE_CARD_AT = ENGLAND_AT + SECTION - OVERLAP;
const OUTRO_AT = SHAPE_CARD_AT + CARD - OVERLAP;
export const NETWORKS_DURATION = OUTRO_AT + OUTRO;

const surname = (name: string) => {
  const parts = name.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : name;
};
const nameOf = (net: TeamNetwork, id: number) => surname(net.nodes.find((n) => n.id === id)!.name);

/* Hook ------------------------------------------------------------------- */

const HOOK_W = 480;

function Counter({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: FONT.display,
          fontSize: 92,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.muted, marginTop: 0 }}>
        completed passes
      </div>
    </div>
  );
}

function Hook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const roll = interpolate(frame, [0, COUNT_END], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const spain = Math.round(SPAIN.completed * roll);
  const england = Math.round(ENGLAND.completed * roll);
  // A slow drift in on both pitches, so the first frame already moves.
  const drift = 1 + 0.05 * interpolate(frame, [0, HOOK], [0, 1], clamp);

  const slam = spring({ frame: frame - (COUNT_END + 2), fps, config: { damping: 9, mass: 0.5 } });
  const shake = frame > COUNT_END && frame < COUNT_END + 8 ? Math.sin(frame * 2.7) * 7 : 0;
  // A gentle push in and fade, into the first explainer card.
  const push = interpolate(frame, [HOOK - OVERLAP - 8, HOOK], [0, 1], { ...clamp, easing: ease });
  const glow = interpolate(frame, [COUNT_END, COUNT_END + 6, HOOK], [0, 1, 0.6], clamp);

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${shake}px, 0) scale(${1 + push * 0.15})`,
        opacity: 1 - push,
      }}
    >
      <div style={{ position: "absolute", top: 226, left: 60, right: 60 }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: 36,
            color: C.accent,
            letterSpacing: "0.06em",
          }}
        >
          THE FINAL · FIRST HALF
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: FONT.display,
            fontSize: 76,
            lineHeight: 1,
          }}
        >
          HOW DID SPAIN AND ENGLAND
          <br />
          SET UP AT EURO 2024?
        </div>
      </div>

      {[
        { net: SPAIN, color: C.sky, label: "SPAIN", left: 40, count: spain },
        { net: ENGLAND, color: C.orange, label: "ENGLAND", left: 560, count: england },
      ].map(({ net, color, label, left, count }) => (
        <div key={label} style={{ position: "absolute", top: 486, left, width: HOOK_W }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 40,
              color,
              letterSpacing: "0.06em",
              lineHeight: 1,
              marginBottom: 10,
            }}
          >
            {label}
          </div>
          <div
            style={{
              borderRadius: 6,
              boxShadow:
                label === "SPAIN"
                  ? `0 0 ${60 * glow}px ${12 * glow}px rgba(56,189,248,0.55)`
                  : "none",
            }}
          >
            <div style={{ transform: `scale(${drift})` }}>
              <NetworkPitch net={net} color={color} width={HOOK_W} showNames={false} />
            </div>
          </div>
          <div style={{ marginTop: 6 }}>
            <Counter value={count} color={color} />
          </div>
        </div>
      ))}

      {frame >= COUNT_END + 2 && (
        <div
          style={{
            position: "absolute",
            top: 1404,
            left: 60,
            right: 60,
            textAlign: "center",
            transform: `scale(${1.6 - 0.6 * slam})`,
            opacity: Math.min(slam * 1.5, 1),
          }}
        >
          <span
            style={{
              display: "inline-block",
              background: C.sky,
              color: "#04100a",
              fontFamily: FONT.display,
              fontSize: 68,
              lineHeight: 1.1,
              letterSpacing: "0.01em",
              padding: "8px 30px 10px",
              borderRadius: 14,
            }}
          >
            SPAIN PASSED {RATIO}X MORE
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
}

/* Explainer cards --------------------------------------------------------- */

/**
 * A short pause between scenes that says what's coming: a kicker, a two-line
 * headline that rises in line by line, one short line, and an optional little
 * diagram.
 */
function Card({
  kicker,
  lines,
  body,
  children,
}: {
  kicker: string;
  lines: [string, string];
  body: ReactNode;
  children?: ReactNode;
}) {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, OVERLAP], [0, 1], clamp);
  const rise = (from: number) => {
    const t = interpolate(frame, [from, from + 14], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    return { opacity: t, transform: `translateY(${(1 - t) * 40}px)` };
  };
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <Backdrop />
      <div style={{ position: "absolute", top: 560, left: 80, right: 80 }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: 38,
            letterSpacing: "0.08em",
            color: C.accent,
            ...rise(4),
          }}
        >
          {kicker}
        </div>
        <div style={{ fontFamily: FONT.display, fontSize: 118, lineHeight: 1, marginTop: 10 }}>
          <div style={rise(8)}>{lines[0]}</div>
          <div style={rise(14)}>{lines[1]}</div>
        </div>
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: 60,
            letterSpacing: "0.02em",
            color: C.sky,
            marginTop: 28,
            ...rise(22),
          }}
        >
          {body}
        </div>
        {children && <div style={{ marginTop: 40, ...rise(26) }}>{children}</div>}
      </div>
    </AbsoluteFill>
  );
}

/** Two players and the line between them thickening: how to read a link. */
function LinkKey() {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [28, 58], [0, 1], { ...clamp, easing: ease });
  const passes = Math.round(1 + 30 * t);
  const disc = (cx: number, n: string) => (
    <g>
      <circle cx={cx} cy={40} r={34} fill={C.sky} stroke="rgba(4,10,7,0.95)" strokeWidth={3} />
      <text
        x={cx}
        y={40}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={FONT.display}
        fontSize={40}
        fill="#04100a"
      >
        {n}
      </text>
    </g>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
      <svg width={360} height={80}>
        <line
          x1={40}
          y1={40}
          x2={320}
          y2={40}
          stroke={C.sky}
          strokeWidth={3 + 15 * t}
          strokeOpacity={0.4 + 0.5 * t}
        />
        {disc(40, "14")}
        {disc(320, "3")}
      </svg>
      <div style={{ fontFamily: FONT.display, fontSize: 44, color: C.sky }}>
        {passes} {passes === 1 ? "PASS" : "PASSES"}
      </div>
    </div>
  );
}

/* Chapters ---------------------------------------------------------------- */

const CHAPTER_W = 760;
/** Where the chapter pitch starts; it ends just past the safe zone's lower edge, on the goal line. */
const CHAPTER_TOP = 382;

function Chapter({
  net,
  color,
  title,
  enterFrom,
  exitTo,
}: {
  net: TeamNetwork;
  color: string;
  title: string;
  enterFrom: number;
  exitTo: number;
}) {
  const frame = useCurrentFrame();
  const minute = interpolate(frame, [BUILD_START, BUILD_END], [0, END_MINUTE], clamp);
  const pace = END_MINUTE / (BUILD_END - BUILD_START);
  const state = networkAt(net, minute, pace);
  const highlight =
    interpolate(frame, [BUILD_END + 4, BUILD_END + 16], [0, 1], clamp) *
    (0.75 + 0.25 * Math.sin((frame - BUILD_END) / 4));
  const chip = interpolate(frame, [BUILD_END + 8, BUILD_END + 18], [0, 1], clamp);

  // Whip-pan in and out, with a horizontal smear while moving.
  const enter = interpolate(frame, [0, OVERLAP], [1, 0], { ...clamp, easing: ease });
  const exit = interpolate(frame, [SECTION - OVERLAP, SECTION], [0, 1], { ...clamp, easing: ease });
  const x = enter * enterFrom * 1080 + exit * exitTo * 1080;
  const whipIn = enterFrom !== 0 ? Math.sin(enter * Math.PI) : 0;
  const blur = 18 * Math.max(whipIn, Math.sin(exit * Math.PI));
  // With nowhere to whip in from, settle out of the hook's punch-in instead.
  const settle = enterFrom === 0 ? enter : 0;

  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${x}px) scale(${1 + 0.12 * settle})`,
        opacity: 1 - settle,
        filter: blur > 0.5 ? `blur(${blur}px)` : undefined,
      }}
    >
      <Backdrop />
      <div style={{ position: "absolute", top: 214, left: 60, right: 60 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontFamily: FONT.display, fontSize: 112, lineHeight: 1, color }}>
            {title.toUpperCase()}
          </div>
          <div style={{ fontFamily: FONT.display, fontSize: 76, lineHeight: 1, color: C.text }}>
            {Math.min(45, Math.floor(minute))}’
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 700, color: C.muted }}>
            First half · started <span style={{ color: C.text }}>{net.formation}</span>
          </div>
          <div style={{ fontFamily: FONT.display, fontSize: 40, letterSpacing: "0.03em", color }}>
            {state.landed} {state.landed === 1 ? "PASS" : "PASSES"}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", top: CHAPTER_TOP, left: (1080 - CHAPTER_W) / 2 }}>
        <NetworkPitch
          net={net}
          color={color}
          width={CHAPTER_W}
          minute={minute}
          pace={pace}
          highlight={highlight}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: CHAPTER_TOP + 100,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: chip,
          transform: `translateY(${(1 - chip) * 30}px)`,
        }}
      >
        <div
          style={{
            background: "rgba(4,10,7,0.88)",
            border: `2px solid ${color}`,
            borderRadius: 18,
            padding: "14px 26px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: FONT.display, fontSize: 52, lineHeight: 1.1 }}>
            {nameOf(net, net.topPair.a).toUpperCase()}
            {/* Anton has no arrows; borrow Inter's. */}
            <span
              style={{
                fontFamily: FONT.sans,
                fontWeight: 800,
                fontSize: 44,
                margin: "0 14px",
                color,
              }}
            >
              ↔
            </span>
            {nameOf(net, net.topPair.b).toUpperCase()}
          </div>
          <div style={{ fontFamily: FONT.display, fontSize: 32, letterSpacing: "0.05em", color }}>
            {net.topPair.count} PASSES · STRONGEST LINK
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* Outro ------------------------------------------------------------------- */

const OUTRO_W = 490;

function Outro() {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 10], [0, 1], clamp);
  const measure = interpolate(frame, [16, 60], [0, 1], clamp);
  const takeaway = interpolate(frame, [56, 70], [0, 1], clamp);
  const line = interpolate(frame, [84, 96], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Backdrop />
      <div style={{ position: "absolute", top: 250, left: 60, right: 60 }}>
        <div style={{ fontFamily: FONT.display, fontSize: 132, lineHeight: 1 }}>
          <span style={{ color: C.sky }}>{SPAIN.completed}</span>
          <span style={{ color: C.muted }}> VS </span>
          <span style={{ color: C.orange }}>{ENGLAND.completed}</span>
        </div>
        <div style={{ fontSize: 34, fontWeight: 700, color: C.muted, marginTop: 10 }}>
          Completed passes, first half. Spain won 2–1.
        </div>
      </div>
      {[
        { net: SPAIN, color: C.sky, left: 40 },
        { net: ENGLAND, color: C.orange, left: 550 },
      ].map(({ net, color, left }) => (
        <div key={net.team} style={{ position: "absolute", top: 470, left }}>
          <NetworkPitch
            net={net}
            color={color}
            width={OUTRO_W}
            showNames={false}
            measure={measure}
          />
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          top: 470 + uprightHeight(OUTRO_W) + 26,
          left: 60,
          right: 60,
          opacity: takeaway,
          transform: `translateY(${(1 - takeaway) * 20}px)`,
          fontSize: 34,
          fontWeight: 700,
          lineHeight: 1.3,
          color: C.muted,
        }}
      >
        Front to back: <span style={{ color: C.sky }}>Spain {SPAIN_SHAPE.height} m</span>,{" "}
        <span style={{ color: C.orange }}>England {ENGLAND_SHAPE.height} m</span>.
        <br />
        <span style={{ color: C.text }}>
          Spain&apos;s last defender sat {LINE_GAP} m higher up the pitch.
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 470 + uprightHeight(OUTRO_W) + 150,
          left: 60,
          right: 60,
          opacity: line,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Lockup size={48} />
        <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.accent }}>pitchkitjs.com</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 470 + uprightHeight(OUTRO_W) + 236,
          left: 60,
          right: 60,
          opacity: interpolate(frame, [92, 104], [0, 1], clamp),
          fontSize: 34,
          fontWeight: 700,
          lineHeight: 1.3,
          color: C.muted,
        }}
      >
        Both networks drawn with PitchKit.
        <br />
        <span style={{ color: C.text }}>React-first, free and open source.</span>
      </div>
    </AbsoluteFill>
  );
}

/* Reel -------------------------------------------------------------------- */

function Layer({
  from,
  duration,
  children,
}: {
  from: number;
  duration: number;
  children: ReactNode;
}) {
  return (
    <Sequence from={from} durationInFrames={duration}>
      {children}
    </Sequence>
  );
}

export function NetworksReel() {
  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans, color: C.text }}>
      <Backdrop />
      <Layer from={0} duration={HOOK}>
        <Hook />
      </Layer>
      <Layer from={NETWORKS_CARD_AT} duration={CARD}>
        <Card
          kicker="FIRST"
          lines={["CHECK OUT THE", "PASS NETWORKS"]}
          body="THICKER = MORE PASSES"
        >
          <LinkKey />
        </Card>
      </Layer>
      <Layer from={SPAIN_AT} duration={SECTION}>
        <Chapter net={SPAIN} color={C.sky} title="Spain" enterFrom={0} exitTo={-1} />
      </Layer>
      <Layer from={ENGLAND_AT} duration={SECTION}>
        <Chapter net={ENGLAND} color={C.orange} title="England" enterFrom={1} exitTo={-1} />
      </Layer>
      <Layer from={SHAPE_CARD_AT} duration={CARD}>
        <Card kicker="THEN" lines={["MEASURE", "THE SHAPE"]} body="FRONT TO BACK. SIDE TO SIDE." />
      </Layer>
      <Layer from={OUTRO_AT} duration={OUTRO}>
        <Outro />
      </Layer>
    </AbsoluteFill>
  );
}
