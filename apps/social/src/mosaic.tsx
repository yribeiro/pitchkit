/**
 * The wall mosaic: one 3240x2880 picture that, cut into six 1080x1440 tiles
 * and posted in reverse order, assembles on the profile grid. A full pitch
 * runs across the middle (crossing the seam between the rows), with the
 * brand line above it. Every mark is a real PitchKit layer on the Euro 2024
 * final: a hexbin of Spain's passes, the build-up to Oyarzabal's winner, and
 * every shot from both teams (England mirrored to attack left).
 */
import type { CSSProperties } from "react";
import { Annotate, Arrows, Comet, Hexbin, Pitch, Scatter } from "@pitchkit/react";
import { shotRadius } from "./charts";
import { Backdrop, PitchStage } from "./components/Chrome";
import { Mark } from "./components/Logo";
import { finalShots, oyarzabalGoal, spainPasses, surname } from "./data";
import type { Shot } from "./data";
import { C, densityAppearance, FONT, MOSAIC, TILE } from "./theme";

const PITCH_W = 3000;
// Padding scales with the pitch: the box-style goals sit behind each goal line.
const PAD_M = { top: 12, bottom: 12, left: 56, right: 56 } as const;
const PITCH_H = Math.round(
  ((PITCH_W - PAD_M.left - PAD_M.right) * 80) / 120 + PAD_M.top + PAD_M.bottom,
);
const PITCH_LEFT = (MOSAIC.width - PITCH_W) / 2;
const PITCH_TOP = MOSAIC.height - 150 - PITCH_H;
/** The layers are sized for a ~1000px pitch; this is how far they scale up. */
const S = PITCH_W / 1000;

const mirrored = (s: Shot): Shot => ({ ...s, x: 120 - s.x, y: 80 - s.y });
const spainShots = finalShots.filter((s) => s.team === "Spain");
const englandShots = finalShots.filter((s) => s.team === "England").map(mirrored);
const goals = [...spainShots, ...englandShots].filter((s) => s.goal);

const pitchVars = { "--pitch-line-width": "7" } as CSSProperties;

export function WallMosaic() {
  const chain = oyarzabalGoal;
  const passes = chain.moves.filter((m) => m.kind === "pass");
  const carries = chain.moves.filter((m) => m.kind === "carry");

  return (
    <Backdrop>
      <div style={{ position: "absolute", left: 120, top: 120 }}>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 54,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: C.accent,
          }}
        >
          Open source · MIT · React + TypeScript
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 224,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.0,
          }}
        >
          Football visualised
          <br />
          for the <span style={{ color: C.accent }}>web.</span>
        </div>
      </div>

      <div style={{ position: "absolute", right: 130, top: 130 }}>
        <Mark size={380} />
      </div>

      <div style={{ position: "absolute", left: PITCH_LEFT, top: PITCH_TOP }}>
        <PitchStage labelSize={64} style={pitchVars}>
          <Pitch
            type="statsbomb"
            width={PITCH_W}
            height={PITCH_H}
            padding={PAD_M}
            appearance={densityAppearance}
          >
            <Hexbin
              data={spainPasses}
              x={(p) => p.x}
              y={(p) => p.y}
              binsX={26}
              colorMin="#0f3d24"
              colorMax={C.emerald}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth={2 * S}
            />
            <Comet
              data={carries}
              x={(m) => m.x}
              y={(m) => m.y}
              x2={(m) => m.endX}
              y2={(m) => m.endY}
              color="white"
              gradient
              endWidth={9 * S}
            />
            <Arrows
              data={passes}
              x={(m) => m.x}
              y={(m) => m.y}
              x2={(m) => m.endX}
              y2={(m) => m.endY}
              stroke="white"
              strokeWidth={4 * S}
              headSize={16 * S}
            />
            <Scatter
              data={passes}
              x={(m) => m.x}
              y={(m) => m.y}
              r={7 * S}
              fill="white"
              stroke="rgba(0,0,0,0.85)"
              strokeWidth={2 * S}
            />
            <Scatter
              data={spainShots.filter((s) => !s.goal)}
              x={(s) => s.x}
              y={(s) => s.y}
              r={(s) => shotRadius(s.xg, S * 0.8)}
              fill={C.sky}
              fillOpacity={0.7}
              stroke="white"
              strokeWidth={1.5 * S}
            />
            <Scatter
              data={englandShots.filter((s) => !s.goal)}
              x={(s) => s.x}
              y={(s) => s.y}
              r={(s) => shotRadius(s.xg, S * 0.8)}
              fill="#e2e8f0"
              fillOpacity={0.7}
              stroke="white"
              strokeWidth={1.5 * S}
            />
            <Scatter
              data={goals}
              x={(s) => s.x}
              y={(s) => s.y}
              r={(s) => shotRadius(s.xg, S * 0.8) + 4 * S}
              fill={C.orange}
              stroke="white"
              strokeWidth={2.5 * S}
            />
            <Annotate
              data={goals}
              x={(s) => s.x}
              y={(s) => s.y}
              label={(s) => `${surname(s.player)} ${s.minute + 1}'`}
              // Hand-placed so no label sits on the row seam (Palmer, just above it,
              // goes below) or the shot cluster (Oyarzabal's goes to the left).
              offsetX={(s) => (s.player.includes("Oyarzabal") ? -250 : s.x > 60 ? -190 : 0)}
              offsetY={(s) =>
                s.player.includes("Oyarzabal") ? 60 : s.player.includes("Palmer") ? 130 : -90
              }
            />
          </Pitch>
        </PitchStage>
      </div>

      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          bottom: 60,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontFamily: FONT.mono,
          fontSize: 46,
          color: C.faint,
        }}
      >
        <span>Spain 2–1 England · Euro 2024 final · StatsBomb open data</span>
        <span style={{ color: C.muted, fontSize: 54 }}>pitchkitjs.com</span>
      </div>
    </Backdrop>
  );
}

/** Preview cells: one third of the tile's width, so the six add up to ~1080px. */
const PREVIEW_CELL = { width: 360, height: 480 } as const;
const PREVIEW_GAP = 6;
export const MOSAIC_PREVIEW = {
  width: PREVIEW_CELL.width * 3 + PREVIEW_GAP * 2,
  height: PREVIEW_CELL.height * 2 + PREVIEW_GAP,
} as const;

/**
 * The mosaic as it will look on the profile grid: six 3:4 tiles with the
 * grid's hairline gaps, each a clipped window onto the same artwork.
 */
export function WallMosaicPreview() {
  const scale = PREVIEW_CELL.width / TILE.width;
  return (
    <div
      style={{
        width: MOSAIC_PREVIEW.width,
        height: MOSAIC_PREVIEW.height,
        background: "#1c1f24",
        position: "relative",
      }}
    >
      {Array.from({ length: 6 }, (_, i) => {
        const [col, row] = [i % 3, Math.floor(i / 3)];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: col * (PREVIEW_CELL.width + PREVIEW_GAP),
              top: row * (PREVIEW_CELL.height + PREVIEW_GAP),
              width: PREVIEW_CELL.width,
              height: PREVIEW_CELL.height,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: MOSAIC.width,
                height: MOSAIC.height,
                transform: `scale(${scale}) translate(${-col * TILE.width}px, ${-row * TILE.height}px)`,
                transformOrigin: "0 0",
              }}
            >
              <WallMosaic />
            </div>
          </div>
        );
      })}
    </div>
  );
}
