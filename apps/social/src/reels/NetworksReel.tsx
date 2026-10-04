/**
 * Reel 04: "283 vs 112". Spain's and England's first-half pass networks in the
 * Euro 2024 final, built pass by pass.
 *
 * Hook (0-3 s): both networks build side by side in fast-forward from the
 * very first frame, with pass counters racing — the contrast is the hook.
 * At ~2.2 s the counters lock and the gap slams in, then a punch-in on Spain
 * carries straight into the first chapter. Spain builds at readable speed and
 * holds on its strongest link; a whip-pan to England does the same; the outro
 * puts the two finished networks side by side again, so the loop lands back
 * where the hook started.
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
import { NetworkPitch, networkAt, uprightHeight } from "./NetworkPitch";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);

const SPAIN = passNetworks.spain;
const ENGLAND = passNetworks.england;
const END_MINUTE = Math.max(...[...SPAIN.passes, ...ENGLAND.passes].map((p) => p.t)) + 0.1;
const RATIO = (SPAIN.completed / ENGLAND.completed).toFixed(1);

// Timeline (30 fps).
const HOOK = 96;
const HOOK_BUILD = 64;
const SECTION = 210;
const BUILD_START = 12;
const BUILD_END = 160;
const OVERLAP = 10;
const SPAIN_AT = HOOK - 8;
const ENGLAND_AT = SPAIN_AT + SECTION - OVERLAP;
const OUTRO_AT = ENGLAND_AT + SECTION - OVERLAP;
const OUTRO = 96;
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
          fontFamily: FONT.mono,
          fontSize: 84,
          fontWeight: 700,
          color,
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.muted, marginTop: 2 }}>
        completed passes
      </div>
    </div>
  );
}

function Hook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const minute = interpolate(frame, [0, HOOK_BUILD], [0, END_MINUTE], clamp);
  // In fast-forward a ball is in the air for ~6 frames.
  const flight = (6 / HOOK_BUILD) * END_MINUTE;
  const spain = networkAt(SPAIN, minute, flight).landed;
  const england = networkAt(ENGLAND, minute, flight).landed;

  const slam = spring({ frame: frame - (HOOK_BUILD + 2), fps, config: { damping: 9, mass: 0.5 } });
  const shake = frame > HOOK_BUILD && frame < HOOK_BUILD + 8 ? Math.sin(frame * 2.7) * 7 : 0;
  // Punch-in on Spain, into the first chapter.
  const push = interpolate(frame, [HOOK - 18, HOOK], [0, 1], { ...clamp, easing: ease });
  const glow = interpolate(frame, [HOOK_BUILD, HOOK_BUILD + 6, HOOK], [0, 1, 0.6], clamp);

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${shake}px, 0) scale(${1 + push * 0.9})`,
        transformOrigin: `${40 + HOOK_W / 2}px 860px`,
        opacity: 1 - push,
      }}
    >
      <div style={{ position: "absolute", top: 236, left: 60, right: 60 }}>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 30,
            fontWeight: 600,
            color: C.accent,
            letterSpacing: "0.12em",
          }}
        >
          EURO 2024 FINAL · FIRST HALF
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 74,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.02,
          }}
        >
          Same final.
          <br />
          Same 45 minutes.
        </div>
      </div>

      {[
        { net: SPAIN, color: C.sky, label: "SPAIN", left: 40, count: spain },
        { net: ENGLAND, color: C.orange, label: "ENGLAND", left: 560, count: england },
      ].map(({ net, color, label, left, count }) => (
        <div key={label} style={{ position: "absolute", top: 486, left, width: HOOK_W }}>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 30,
              fontWeight: 700,
              color,
              letterSpacing: "0.1em",
              marginBottom: 12,
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
            <NetworkPitch
              net={net}
              color={color}
              width={HOOK_W}
              minute={minute}
              flight={flight}
              showNames={false}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <Counter value={count} color={color} />
          </div>
        </div>
      ))}

      {frame >= HOOK_BUILD + 2 && (
        <div
          style={{
            position: "absolute",
            top: 1392,
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
              fontSize: 58,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              padding: "10px 26px 14px",
              borderRadius: 14,
            }}
          >
            Spain passed {RATIO}× more
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
  // ~7 frames in the air at chapter speed.
  const flight = (7 / (BUILD_END - BUILD_START)) * END_MINUTE;
  const state = networkAt(net, minute, flight);
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
      <div style={{ position: "absolute", top: 230, left: 60, right: 60 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: "-0.045em", color }}>
            {title}
          </div>
          <div
            style={{
              fontSize: 60,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
              color: C.text,
            }}
          >
            {Math.min(45, Math.floor(minute))}’
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.muted }}>
            Built pass by pass · first half
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 32, fontWeight: 700, color }}>
            {state.landed} {state.landed === 1 ? "pass" : "passes"}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", top: 410, left: (1080 - CHAPTER_W) / 2 }}>
        <NetworkPitch
          net={net}
          color={color}
          width={CHAPTER_W}
          minute={minute}
          flight={flight}
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
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em" }}>
            {nameOf(net, net.topPair.a)} ↔ {nameOf(net, net.topPair.b)}
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 28, fontWeight: 600, color }}>
            {net.topPair.count} passes · strongest link
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* Outro ------------------------------------------------------------------- */

const OUTRO_W = 470;

function Outro() {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 10], [0, 1], clamp);
  const line = interpolate(frame, [14, 26], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Backdrop />
      <div style={{ position: "absolute", top: 250, left: 60, right: 60 }}>
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1 }}>
          <span style={{ color: C.sky }}>{SPAIN.completed}</span>
          <span style={{ color: C.muted }}> vs </span>
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
            minute={END_MINUTE + 5}
            flight={1}
            showNames={false}
          />
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          top: 470 + uprightHeight(OUTRO_W) + 50,
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
          top: 470 + uprightHeight(OUTRO_W) + 140,
          left: 60,
          right: 60,
          opacity: interpolate(frame, [24, 36], [0, 1], clamp),
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
