/**
 * Reel 04, 14 s loop: Spain's first-half pass network only, built to replay
 * seamlessly.
 *
 * The timeline starts on the 4-2-3-1 team sheet at a broadcast-camera angle,
 * part of the pitch off screen; the pitch swings flat and upright as the
 * passes start counting and the players move. The half replays over 8.5 s,
 * holds on the strongest link, then rewinds while the camera tilts back, so
 * the last frame runs straight into the first.
 *
 * The video doesn't start at the top of that timeline: frame 0 is OPEN_AT,
 * already mid-swing with passes counting, so the first frame a viewer sees
 * is moving. The still moment on the team sheet sits just before the loop
 * point instead. Sound effects follow the action: a tick every 10 passes, a
 * whoosh on each camera move, a low pop on the payoff.
 */
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Backdrop } from "../components/Chrome";
import { passNetworks } from "../data";
import { C, FONT } from "../theme";
import { NetworkPitch, networkAt, uprightHeight } from "./NetworkPitch";
import { CHAPTER_TOP, CHAPTER_W, END_MINUTE, StrongestLink } from "./NetworksReel";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SPAIN = passNetworks.spain;

// Timeline (30 fps).
/** The tilted team sheet holds this long before play starts. */
const KICK_OFF = 12;
/** The camera swings flat over this long from kick-off. */
const FLATTEN = 48;
/** The half replays from KICK_OFF to here (8.5 s). */
const BUILD_END = 290;
/** The payoff chip is up from BUILD_END + 8 until here. */
const HOLD_END = 368;
/** The rewind and the tilt back start here and land on the team sheet at REWIND_END. */
const REWIND_AT = 372;
const REWIND_END = 410;
export const NETWORKS_LOOP_DURATION = 420;
/** Where frame 0 sits on the timeline: mid-swing, passes already counting. */
const OPEN_AT = KICK_OFF + 8;

/** The video frame at which timeline frame `t` plays. */
const frameOf = (t: number) => (t - OPEN_AT + NETWORKS_LOOP_DURATION) % NETWORKS_LOOP_DURATION;

const inOut = { ...clamp, easing: Easing.inOut(Easing.cubic) };

/** How far the camera is tilted: 1 on the team sheet at both ends of the loop, 0 during play. */
function tiltAt(frame: number) {
  return frame < BUILD_END
    ? interpolate(frame, [KICK_OFF, KICK_OFF + FLATTEN], [1, 0], {
        ...clamp,
        // Quadratic, so the swing is already moving by the opening frame.
        easing: Easing.inOut(Easing.quad),
      })
    : interpolate(frame, [REWIND_AT, REWIND_END], [0, 1], inOut);
}

/**
 * A slow orbit while the team sheet is tilted: 0 → 1 at a steady rate from
 * REWIND_END through the loop point to KICK_OFF, so the camera never stops
 * moving where the loop joins.
 */
function orbitAt(frame: number) {
  // Flattening keeps the orbit's end; tilting back starts from its beginning.
  if (frame > KICK_OFF && frame < REWIND_END) return frame < BUILD_END ? 1 : 0;
  const span = NETWORKS_LOOP_DURATION - REWIND_END + KICK_OFF;
  const t = frame >= REWIND_END ? frame - REWIND_END : frame + NETWORKS_LOOP_DURATION - REWIND_END;
  return t / span;
}

/** Match minute at each frame: 0 on the team sheet, forward over the build, then back. */
function minuteAt(frame: number) {
  if (frame <= BUILD_END) {
    return interpolate(frame, [KICK_OFF, BUILD_END], [0, END_MINUTE], {
      ...clamp,
      easing: Easing.out(Easing.sin),
    });
  }
  return interpolate(frame, [REWIND_AT, REWIND_END], [END_MINUTE, 0], inOut);
}

/** Passes completed by timeline frame `t`. */
function passesAt(t: number) {
  const minute = minuteAt(t);
  return SPAIN.passes.filter((p) => p.t <= minute).length;
}

/** Sound effects, placed on the timeline and wrapped to video frames. */
function LoopAudio() {
  const cues: { at: number; src: string; volume: number; length: number }[] = [];
  // A tick for every 10th pass, louder as the count climbs.
  let tens = 0;
  for (let t = KICK_OFF; t <= BUILD_END; t++) {
    const n = passesAt(t);
    if (Math.floor(n / 10) > tens) {
      tens = Math.floor(n / 10);
      cues.push({
        at: t,
        src: "sfx/tick.wav",
        volume: 0.35 + (0.45 * n) / SPAIN.completed,
        length: 3,
      });
    }
  }
  cues.push({ at: KICK_OFF - 2, src: "sfx/whoosh.wav", volume: 0.7, length: 18 });
  cues.push({ at: BUILD_END + 8, src: "sfx/pop.wav", volume: 0.9, length: 14 });
  cues.push({ at: REWIND_AT, src: "sfx/whoosh.wav", volume: 0.5, length: 18 });

  return (
    <>
      {cues.flatMap(({ at, src, volume, length }, i) => {
        const from = frameOf(at);
        // A cue that runs past the last frame also plays from the top.
        const starts =
          from + length > NETWORKS_LOOP_DURATION ? [from, from - NETWORKS_LOOP_DURATION] : [from];
        return starts.map((start) => (
          <Sequence key={`${i}-${start}`} from={start} durationInFrames={length} layout="none">
            <Audio src={staticFile(src)} volume={volume} />
          </Sequence>
        ));
      })}
    </>
  );
}

export function NetworksLoopReel() {
  const frame = (useCurrentFrame() + OPEN_AT) % NETWORKS_LOOP_DURATION;
  const minute = minuteAt(frame);
  const pace = END_MINUTE / (BUILD_END - KICK_OFF);
  const state = networkAt(SPAIN, minute, pace);
  const highlight =
    interpolate(frame, [BUILD_END + 4, BUILD_END + 16, HOLD_END, REWIND_AT], [0, 1, 1, 0], clamp) *
    (0.75 + 0.25 * Math.sin((frame - BUILD_END) / 4));
  const chip = interpolate(
    frame,
    [BUILD_END + 8, BUILD_END + 18, HOLD_END, REWIND_AT],
    [0, 1, 1, 0],
    clamp,
  );
  const tilt = tiltAt(frame);
  const camera = [
    "perspective(1700px)",
    `rotateX(${48 * tilt}deg)`,
    `rotateZ(${(-32 + 8 * orbitAt(frame)) * tilt}deg)`,
    `scale(${1 + (0.42 - 0.06 * orbitAt(frame)) * tilt})`,
  ].join(" ");

  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans, color: C.text }}>
      <LoopAudio />
      <Backdrop />
      <div
        style={{
          position: "absolute",
          top: CHAPTER_TOP,
          left: (1080 - CHAPTER_W) / 2,
          transform: camera,
          // Pivot below the centre so the back line, nearest the camera, stays in shot.
          transformOrigin: `50% ${uprightHeight(CHAPTER_W) * 0.62}px`,
        }}
      >
        <NetworkPitch
          net={SPAIN}
          color={C.sky}
          width={CHAPTER_W}
          minute={minute}
          pace={pace}
          highlight={highlight}
        />
      </div>
      {/* Keeps the header readable over the tilted pitch. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 460,
          background: `linear-gradient(${C.bg} 78%, transparent)`,
          opacity: tilt,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 214,
          left: 60,
          right: 60,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontFamily: FONT.display, fontSize: 76, lineHeight: 1.02 }}>
          <div>
            HOW DID <span style={{ color: C.sky }}>SPAIN</span>
          </div>
          <div>SET UP AT EURO 2024?</div>
        </div>
        <div style={{ textAlign: "right", color: C.sky }}>
          <div style={{ fontFamily: FONT.display, fontSize: 72, lineHeight: 1 }}>
            {state.landed}
          </div>
          <div style={{ fontFamily: FONT.display, fontSize: 40, letterSpacing: "0.03em" }}>
            {state.landed === 1 ? "PASS" : "PASSES"}
          </div>
        </div>
      </div>

      <StrongestLink net={SPAIN} color={C.sky} show={chip} />
    </AbsoluteFill>
  );
}
