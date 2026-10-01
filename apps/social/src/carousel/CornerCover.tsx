/**
 * Carousel 01, slide 1 — the cover. Heavy condensed type on solid black with
 * one emerald block, over a real corner from the SkillCorner open data.
 */
import { Comet, Pitch, Scatter } from "@pitchkit/react";
import { AbsoluteFill } from "remotion";
import { PitchStage } from "../components/Chrome";
import { cornersData } from "../data";
import { appearance, C, FONT } from "../theme";

const DISPLAY = "Anton, Impact, sans-serif";
const COVER_CORNER = cornersData.corners.find((c) => c.minute === 62) ?? cornersData.corners[0]!;
const SHOWN = 6; // frames after the kick: the ball is in the air

// The window of the pitch shown, in centre-origin metres: the box and the
// ball arriving into it.
const CROP = { x0: 12, x1: 52, y0: -20, y1: 6 };
const SHOW_W = 960;
const PAD = { top: 4, right: 4, bottom: 4, left: 4 };
const K = (SHOW_W - PAD.left - PAD.right) / (CROP.x1 - CROP.x0);
const SHOW_H = (CROP.y1 - CROP.y0) * K + PAD.top + PAD.bottom;

export function CornerCover() {
  const { frames } = COVER_CORNER;
  const now = frames.find((f) => f.frame === SHOWN) ?? frames.at(-1)!;
  const trail = frames
    .filter((f) => f.ball && f.frame >= 0 && f.frame <= SHOWN)
    .map((f, i, all) => (i === 0 ? null : { from: all[i - 1]!.ball!, to: f.ball! }))
    .filter((s): s is { from: [number, number]; to: [number, number] } => s !== null);
  const players = now.players.map(([, x, y, att, detected]) => ({ x, y, att, detected }));

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT.sans, color: C.text }}>
      <div style={{ position: "absolute", top: 88, left: 64 }}>
        <div
          style={{
            display: "inline-block",
            background: C.accent,
            color: "#000",
            fontFamily: DISPLAY,
            fontSize: 150,
            lineHeight: 1,
            padding: "14px 30px 6px",
            letterSpacing: "0.01em",
          }}
        >
          5 STEPS
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: DISPLAY,
            fontSize: 196,
            lineHeight: 0.96,
            letterSpacing: "0.005em",
            textTransform: "uppercase",
          }}
        >
          Analyse any
          <br />
          corner kick.
        </div>
      </div>

      <div style={{ position: "absolute", left: 60, bottom: 40 }}>
        <PitchStage>
          <Pitch
            type="skillcorner"
            dimensions={{
              length: cornersData.pitchLength,
              width: cornersData.pitchWidth,
            }}
            width={SHOW_W}
            height={SHOW_H}
            padding={PAD}
            crop={CROP}
            appearance={appearance}
          >
            <Comet
              data={trail}
              x={(s) => s.from[0]}
              y={(s) => s.from[1]}
              x2={(s) => s.to[0]}
              y2={(s) => s.to[1]}
              color="white"
              gradient
              endWidth={7}
            />
            <Scatter
              data={players}
              x={(p) => p.x}
              y={(p) => p.y}
              r={15}
              fill={(p) => (p.att ? C.sky : C.orange)}
              fillOpacity={(p) => (p.detected ? 1 : 0.7)}
              stroke="rgba(6,16,11,0.9)"
              strokeWidth={2.5}
            />
            {now.ball && (
              <Scatter
                data={[now.ball]}
                x={(b) => b[0]}
                y={(b) => b[1]}
                r={9}
                fill="white"
                stroke="#111"
                strokeWidth={2.5}
              />
            )}
          </Pitch>
        </PitchStage>
      </div>

      <div
        style={{
          position: "absolute",
          right: 64,
          bottom: 78,
          fontFamily: DISPLAY,
          fontSize: 44,
          letterSpacing: "0.04em",
          background: "#000",
          color: C.accent,
          padding: "6px 22px 2px",
          border: `3px solid ${C.accent}`,
        }}
      >
        SWIPE →
      </div>
    </AbsoluteFill>
  );
}
