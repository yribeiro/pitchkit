import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";
import { Backdrop, InstallPill } from "./Chrome";
import { Mark } from "./Logo";

/** The closing card every reel ends on: mark, tagline, install, URL. */
export function EndCard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14 } });
  const rise = (delay: number) => ({
    opacity: interpolate(frame, [delay, delay + 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    transform: `translateY(${interpolate(frame, [delay, delay + 14], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
  });

  return (
    <AbsoluteFill
      style={{ opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }) }}
    >
      <Backdrop>
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 44,
            paddingBottom: 200,
          }}
        >
          <div style={{ transform: `scale(${pop})` }}>
            <Mark size={220} />
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: "-0.035em", ...rise(6) }}>
            PitchKit
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 600,
              color: C.muted,
              textAlign: "center",
              lineHeight: 1.25,
              ...rise(12),
            }}
          >
            Football visualised
            <br />
            for the <span style={{ color: C.accent }}>web.</span>
          </div>
          <div style={rise(18)}>
            <InstallPill size={38} />
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 36, color: C.text, ...rise(24) }}>
            pitchkitjs.com
          </div>
        </AbsoluteFill>
      </Backdrop>
    </AbsoluteFill>
  );
}
