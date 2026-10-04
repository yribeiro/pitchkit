/**
 * Reel 04: "283 vs 112". Spain's and England's first-half pass networks in the
 * Euro 2024 final.
 *
 * Hook (0-2.8 s): both finished networks side by side from the first frame,
 * pass counters rolling up underneath — the contrast is the hook. At ~1.3 s
 * the counters lock and the gap slams in, then a punch-in on Spain carries
 * into the first chapter. There the half replays: discs drift as each
 * player's average position takes in every touch and settle into the shape
 * the hook showed, while partnerships draw in and thicken. It holds on the
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
import type { Link } from "./NetworkPitch";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);

const SPAIN = passNetworks.spain;
const ENGLAND = passNetworks.england;
const END_MINUTE = Math.max(...[...SPAIN.passes, ...ENGLAND.passes].map((p) => p.t)) + 0.1;
const RATIO = (SPAIN.completed / ENGLAND.completed).toFixed(1);
const SPAIN_SHAPE = shapeOf(SPAIN);
const ENGLAND_SHAPE = shapeOf(ENGLAND);

// Timeline (30 fps).
const HOOK = 84;
/** The counters roll up until here, then the gap slams in. */
const COUNT_END = 36;
const SECTION = 210;
const BUILD_START = 12;
const BUILD_END = 160;
const OVERLAP = 10;
const SPAIN_AT = HOOK - 8;
const ENGLAND_AT = SPAIN_AT + SECTION - OVERLAP;
const OUTRO_AT = ENGLAND_AT + SECTION - OVERLAP;
const OUTRO = 126;
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
  // Punch-in on Spain, into the first chapter.
  const push = interpolate(frame, [HOOK - 18, HOOK], [0, 1], { ...clamp, easing: ease });
  const glow = interpolate(frame, [COUNT_END, COUNT_END + 6, HOOK], [0, 1, 0.6], clamp);

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${shake}px, 0) scale(${1 + push * 0.9})`,
        transformOrigin: `${40 + HOOK_W / 2}px 860px`,
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
          EURO 2024 FINAL · FIRST HALF
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: FONT.display,
            fontSize: 76,
            lineHeight: 1,
          }}
        >
          SAME FINAL.
          <br />
          SAME 45 MINUTES.
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

/* Chapters ---------------------------------------------------------------- */

const CHAPTER_W = 720;

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
      <div style={{ position: "absolute", top: 222, left: 60, right: 60 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontFamily: FONT.display, fontSize: 124, lineHeight: 1, color }}>
            {title.toUpperCase()}
          </div>
          <div style={{ fontFamily: FONT.display, fontSize: 84, lineHeight: 1, color: C.text }}>
            {Math.min(45, Math.floor(minute))}’
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginTop: 6,
          }}
        >
          <TopLink net={net} link={state.top} color={color} />
          <div style={{ fontFamily: FONT.display, fontSize: 40, letterSpacing: "0.03em", color }}>
            {state.landed} {state.landed === 1 ? "PASS" : "PASSES"}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", top: 410, left: (1080 - CHAPTER_W) / 2 }}>
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
          top: 410 + 100,
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

/** The partnership with the most passes so far, live. */
function TopLink({
  net,
  link,
  color,
}: {
  net: TeamNetwork;
  link: Link | undefined;
  color: string;
}) {
  return (
    <div style={{ fontSize: 32, fontWeight: 700, color: C.muted }}>
      {link ? (
        <>
          Top link{" "}
          <span style={{ color: C.text }}>
            {nameOf(net, link.a)} ↔ {nameOf(net, link.b)}
          </span>{" "}
          <span style={{ color }}>{link.count}</span>
        </>
      ) : (
        "Kick-off"
      )}
    </div>
  );
}

/* Outro ------------------------------------------------------------------- */

const OUTRO_W = 470;

function Outro() {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 10], [0, 1], clamp);
  const measure = interpolate(frame, [12, 40], [0, 1], clamp);
  const takeaway = interpolate(frame, [36, 46], [0, 1], clamp);
  const line = interpolate(frame, [50, 62], [0, 1], clamp);
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
        { net: SPAIN, color: C.sky, left: 50 },
        { net: ENGLAND, color: C.orange, left: 560 },
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
        Striker to last defender: <span style={{ color: C.sky }}>Spain {SPAIN_SHAPE.height} m</span>
        , <span style={{ color: C.orange }}>England {ENGLAND_SHAPE.height} m</span>.
      </div>
      <div
        style={{
          position: "absolute",
          top: 470 + uprightHeight(OUTRO_W) + 110,
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
          top: 470 + uprightHeight(OUTRO_W) + 196,
          left: 60,
          right: 60,
          opacity: interpolate(frame, [58, 70], [0, 1], clamp),
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
      <Layer from={SPAIN_AT} duration={SECTION}>
        <Chapter net={SPAIN} color={C.sky} title="Spain" enterFrom={0} exitTo={-1} />
      </Layer>
      <Layer from={ENGLAND_AT} duration={SECTION}>
        <Chapter net={ENGLAND} color={C.orange} title="England" enterFrom={1} exitTo={-1} />
      </Layer>
      <Layer from={OUTRO_AT} duration={OUTRO}>
        <Outro />
      </Layer>
    </AbsoluteFill>
  );
}
