/**
 * Reel 04: how Spain and England set up in the Euro 2024 final, from their
 * first-half pass networks.
 *
 * It opens on a block-letter title card ("Let's check out pass networks"),
 * then the question over both finished networks side by side, pass counters
 * rolling up underneath, before the gap slams in. Each chapter replays the half over 7 s:
 * every disc starts in the 4-2-3-1 team sheet and drifts smoothly to the
 * player's average position while partnerships fade in and thicken, then it
 * holds on the strongest link; a whip-pan carries Spain into England. A
 * second card leads into the outro, which measures both finished shapes,
 * then the end card every reel shares.
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
import { EndCard } from "../components/EndCard";
import { passNetworks } from "../data";
import type { TeamNetwork } from "../data";
import { C, FONT } from "../theme";
import { formationUnits, NetworkPitch, networkAt, shapeOf, uprightY } from "./NetworkPitch";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);

const SPAIN = passNetworks.spain;
const ENGLAND = passNetworks.england;
const END_MINUTE = Math.max(...[...SPAIN.passes, ...ENGLAND.passes].map((p) => p.t)) + 0.1;
const RATIO = (SPAIN.completed / ENGLAND.completed).toFixed(1);
const SPAIN_SHAPE = shapeOf(SPAIN);
const ENGLAND_SHAPE = shapeOf(ENGLAND);

// Timeline (30 fps). Each scene overlaps the next by OVERLAP for the transition.
const OVERLAP = 10;
const HOOK = 120;
/** The headline rises in from here. */
const HEADLINE_AT = 4;
/** The counters roll up until here, then the gap slams in. */
const COUNT_END = 56;
/** A title card between scenes. */
const CARD = 66;
/**
 * Each chapter first builds the starting formation unit by unit (back line,
 * holding midfield, attacking midfield, striker), FORMATION_UNIT frames
 * apart, and holds it a moment.
 */
const FORMATION_AT = 12;
const FORMATION_UNIT = 15;
const SECTION = 366;
/** The half replays over these frames of a chapter (7 s), then holds. */
const BUILD_START = 82;
const BUILD_END = 292;
/** The measured shapes, held 0.2 s longer before the end card. */
const OUTRO = 126;
/** The closing card every reel ends on. */
const END = 90;
// The reel opens on the "Let's check out pass networks" card, then the hook.
const HOOK_AT = CARD - OVERLAP;
const SPAIN_AT = HOOK_AT + HOOK - OVERLAP;
const ENGLAND_AT = SPAIN_AT + SECTION - OVERLAP;
const SHAPE_CARD_AT = ENGLAND_AT + SECTION - OVERLAP;
const OUTRO_AT = SHAPE_CARD_AT + CARD - OVERLAP;
const END_AT = OUTRO_AT + OUTRO - OVERLAP;
export const NETWORKS_DURATION = END_AT + END;

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
          fontSize: 84,
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
  const roll = interpolate(frame, [HEADLINE_AT, COUNT_END], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const spain = Math.round(SPAIN.completed * roll);
  const england = Math.round(ENGLAND.completed * roll);
  // A slow drift in on both pitches, so the first frame already moves.
  const drift = 1 + 0.05 * interpolate(frame, [0, HOOK], [0, 1], clamp);
  const headline = (line: number) => {
    const t = interpolate(frame, [HEADLINE_AT + line * 5, HEADLINE_AT + 12 + line * 5], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    return { opacity: t, transform: `translateY(${(1 - t) * 30}px)` };
  };

  const slam = spring({ frame: frame - (COUNT_END + 2), fps, config: { damping: 9, mass: 0.5 } });
  const shake = frame > COUNT_END && frame < COUNT_END + 8 ? Math.sin(frame * 2.7) * 7 : 0;
  // Fade out into the first chapter.
  const fadeOut = interpolate(frame, [HOOK - OVERLAP, HOOK], [0, 1], clamp);
  const glow = interpolate(frame, [COUNT_END, COUNT_END + 6, HOOK], [0, 1, 0.6], clamp);

  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${shake}px)`,
        opacity: interpolate(frame, [0, OVERLAP], [0, 1], clamp) - fadeOut,
      }}
    >
      <div style={{ position: "absolute", top: 240, left: 60, right: 60 }}>
        <div style={{ fontFamily: FONT.display, fontSize: 84, lineHeight: 1 }}>
          <div style={headline(0)}>HOW DID SPAIN AND ENGLAND</div>
          <div style={headline(1)}>SET UP AT EURO 2024?</div>
        </div>
      </div>

      <AbsoluteFill>
        {[
          { net: SPAIN, color: C.sky, label: "SPAIN", left: 40, count: spain },
          { net: ENGLAND, color: C.orange, label: "ENGLAND", left: 560, count: england },
        ].map(({ net, color, label, left, count }) => (
          <div key={label} style={{ position: "absolute", top: 466, left, width: HOOK_W }}>
            <div
              style={{
                fontFamily: FONT.display,
                fontSize: 40,
                color,
                letterSpacing: "0.06em",
                lineHeight: 1,
                marginBottom: 16,
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
            <div style={{ marginTop: 18 }}>
              <Counter value={count} color={color} />
            </div>
          </div>
        ))}
      </AbsoluteFill>

      {frame >= COUNT_END + 2 && (
        <div
          style={{
            position: "absolute",
            top: 1400,
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

/* Title cards ------------------------------------------------------------ */

/**
 * A title between scenes: a few words in big block capitals, rising in one
 * line at a time. The words that name the thing go PitchKit green.
 */
function Card({
  lines,
  opening = false,
}: {
  lines: { text: string; accent?: boolean }[];
  /** The reel's first frame: no fade, and the first line is already in. */
  opening?: boolean;
}) {
  const frame = useCurrentFrame();
  const fadeIn = opening ? 1 : interpolate(frame, [0, OVERLAP], [0, 1], clamp);
  const lead = opening ? -14 : 4;
  const size = 176;
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <Backdrop />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 80px 120px" }}>
        <div style={{ fontFamily: FONT.display, fontSize: size, lineHeight: 0.98 }}>
          {lines.map((line, i) => {
            const t = interpolate(frame, [lead + i * 6, lead + 14 + i * 6], [0, 1], {
              ...clamp,
              easing: Easing.out(Easing.cubic),
            });
            return (
              <div
                key={line.text}
                style={{
                  color: line.accent ? C.accent : C.text,
                  opacity: t,
                  transform: `translateY(${(1 - t) * 60}px)`,
                }}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/* Chapters ---------------------------------------------------------------- */

const CHAPTER_W = 740;
/** Where the chapter pitch starts: ~48 px clear of the header; it ends on the safe zone's lower edge. */
const CHAPTER_TOP = 420;

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
  const reveal = interpolate(
    frame,
    [FORMATION_AT, FORMATION_AT + 4 * FORMATION_UNIT],
    [0, 4],
    clamp,
  );
  // The unit counts stay up while the formation stands, then fade as play
  // starts, when the clock and pass counter come in.
  const unitCounts = interpolate(frame, [BUILD_START, BUILD_START + 12], [1, 0], clamp);
  const live = interpolate(frame, [BUILD_START, BUILD_START + 10], [0, 1], clamp);
  const pace = END_MINUTE / (BUILD_END - BUILD_START);
  const state = networkAt(net, minute, pace);
  // Nothing counts until play starts (England's first pass is logged at 0:00).
  const passes = frame < BUILD_START ? 0 : state.landed;
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
  // With nowhere to whip in from, fade in from the card instead.
  const fadeIn = enterFrom === 0 ? enter : 0;

  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${x}px)`,
        opacity: 1 - fadeIn,
        filter: blur > 0.5 ? `blur(${blur}px)` : undefined,
      }}
    >
      <Backdrop />
      <div style={{ position: "absolute", top: 218, left: 60, right: 60 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontFamily: FONT.display, fontSize: 104, lineHeight: 1, color }}>
            {title.toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 72,
              lineHeight: 1,
              color: C.text,
              opacity: live,
            }}
          >
            {Math.min(45, Math.floor(minute))}’
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 700, color: C.muted }}>
            First half · started <span style={{ color: C.text }}>{net.formation}</span>
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 40,
              letterSpacing: "0.03em",
              color,
              opacity: live,
            }}
          >
            {passes} {passes === 1 ? "PASS" : "PASSES"}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: CHAPTER_TOP,
          left: (1080 - CHAPTER_W) / 2,
        }}
      >
        <NetworkPitch
          net={net}
          color={color}
          width={CHAPTER_W}
          minute={minute}
          pace={pace}
          reveal={reveal}
          highlight={highlight}
        />
      </div>

      {/* Each unit's head count, in the gutter beside its line of the formation. */}
      {formationUnits(net).map(({ count, x }, u) => {
        const t = interpolate(reveal, [u + 0.3, u + 0.9], [0, 1], clamp);
        return (
          <div
            key={u}
            style={{
              position: "absolute",
              top: CHAPTER_TOP + uprightY(CHAPTER_W, x),
              left: 0,
              width: (1080 - CHAPTER_W) / 2,
              textAlign: "center",
              transform: `translateY(-50%) translateX(${(1 - t) * -24}px)`,
              fontFamily: FONT.display,
              fontSize: 84,
              lineHeight: 1,
              color,
              opacity: t * unitCounts,
            }}
          >
            {count}
          </div>
        );
      })}

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
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Backdrop />
      <div style={{ position: "absolute", top: 250, left: 60, right: 60 }}>
        <div style={{ fontFamily: FONT.display, fontSize: 132, lineHeight: 1 }}>
          <span style={{ color: C.sky }}>{SPAIN.completed}</span>
          <span style={{ color: C.muted }}> VS </span>
          <span style={{ color: C.orange }}>{ENGLAND.completed}</span>
        </div>
      </div>
      {[
        { net: SPAIN, color: C.sky, left: 40, shape: SPAIN_SHAPE },
        { net: ENGLAND, color: C.orange, left: 550, shape: ENGLAND_SHAPE },
      ].map(({ net, color, left, shape }) => (
        <div key={net.team} style={{ position: "absolute", top: 470, left }}>
          <NetworkPitch
            net={net}
            color={color}
            width={OUTRO_W}
            showNames={false}
            measure={measure}
          />
          <div
            style={{
              marginTop: 22,
              textAlign: "center",
              fontFamily: FONT.display,
              fontSize: 56,
              letterSpacing: "0.02em",
              color,
              opacity: takeaway,
              transform: `translateY(${(1 - takeaway) * 20}px)`,
            }}
          >
            {net.team.toUpperCase()} LENGTH {shape.height}M
          </div>
        </div>
      ))}
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
      <Layer from={0} duration={CARD}>
        <Card
          opening
          lines={[
            { text: "LET'S" },
            { text: "CHECK OUT" },
            { text: "PASS", accent: true },
            { text: "NETWORKS", accent: true },
          ]}
        />
      </Layer>
      <Layer from={HOOK_AT} duration={HOOK}>
        <Hook />
      </Layer>
      <Layer from={SPAIN_AT} duration={SECTION}>
        <Chapter net={SPAIN} color={C.sky} title="Spain" enterFrom={0} exitTo={-1} />
      </Layer>
      <Layer from={ENGLAND_AT} duration={SECTION}>
        <Chapter net={ENGLAND} color={C.orange} title="England" enterFrom={1} exitTo={-1} />
      </Layer>
      <Layer from={SHAPE_CARD_AT} duration={CARD}>
        <Card
          lines={[{ text: "LET'S" }, { text: "MEASURE" }, { text: "THE SHAPE", accent: true }]}
        />
      </Layer>
      <Layer from={OUTRO_AT} duration={OUTRO}>
        <Outro />
      </Layer>
      <Layer from={END_AT} duration={END}>
        <EndCard />
      </Layer>
    </AbsoluteFill>
  );
}
