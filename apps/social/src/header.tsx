/**
 * The X (Twitter) profile header — 1500x500 (3:1). A hexbin of Spain's passes
 * in the Euro 2024 final, with their goals marked. The pitch is a full-length
 * slice of the middle third (StatsBomb y 20..60 is exactly 3:1 against the 120
 * length), so both penalty areas and the centre circle fit. Headline text
 * starts at x=300 to clear the profile picture, which overlaps the bottom-left.
 */
import type { CSSProperties } from "react";
import { Hexbin, Pitch, Scatter } from "@pitchkit/react";
import { Backdrop, PitchStage } from "./components/Chrome";
import { finalShots, spainPasses } from "./data";
import { C, densityAppearance, FONT } from "./theme";

export const X_HEADER = { width: 1500, height: 500 } as const;

const pitchVars = { "--pitch-line-width": "2.5" } as CSSProperties;

export function XHeader() {
  const goals = finalShots.filter((s) => s.goal && s.team === "Spain");

  return (
    <Backdrop>
      <div style={{ position: "absolute", inset: 0 }}>
        <PitchStage style={pitchVars}>
          <Pitch
            type="statsbomb"
            width={X_HEADER.width}
            height={X_HEADER.height}
            crop={{ x0: 0, y0: 20, x1: 120, y1: 60 }}
            padding={{ top: 0, bottom: 0, left: 0, right: 0 }}
            appearance={densityAppearance}
          >
            <Hexbin
              data={spainPasses}
              x={(p) => p.x}
              y={(p) => p.y}
              binsX={30}
              colorMin="#0f3d24"
              colorMax={C.emerald}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth={1}
            />
            <Scatter
              data={goals}
              x={(s) => s.x}
              y={(s) => s.y}
              r={14}
              fill={C.orange}
              stroke="white"
              strokeWidth={2.5}
            />
          </Pitch>
        </PitchStage>
      </div>

      {/* Fades the pitch out behind the headline so the text stays readable. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, #000 0%, #000 22%, rgba(0,0,0,0.88) 42%, rgba(0,0,0,0.35) 62%, rgba(0,0,0,0) 80%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 300,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.0,
          }}
        >
          Football visualised
          <br />
          for the <span style={{ color: C.accent }}>web.</span>
        </div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 26,
            fontWeight: 600,
            color: C.muted,
            letterSpacing: "0.02em",
          }}
        >
          Open-source React + TypeScript · pitchkitjs.com
        </div>
      </div>
    </Backdrop>
  );
}
