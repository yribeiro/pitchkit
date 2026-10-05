/**
 * LinkedIn images (1200 x 1200, which the feed never crops): one PitchKit
 * layer on real Euro 2024 final data, with the component name, a stat and the
 * line of code that draws it. The beats are the ones reel 03 uses, turned to
 * the horizontal pitch; Flow is redrawn from Spain's real passes, since reel
 * 03's Flow is an illustrative pattern.
 */
import type { CSSProperties } from "react";
import { Flow, MomentumChart } from "@pitchkit/react";
import { AbsoluteFill } from "remotion";
import { Backdrop } from "../components/Chrome";
import { layersReel as L, momentum, spainPasses } from "../data";
import { BEATS, BeatPitch, voronoiMarks } from "../reels/layer-beats";
import type { Beat } from "../reels/layer-beats";
import { C, FONT, pitchVars } from "../theme";

const spainComplete = spainPasses.filter((p) => p.complete);
// Passes that gain 5+ units: a flow map averages direction per zone, so mixing
// forward and back passes cancels the arrows out.
const spainForward = spainComplete.filter((p) => p.endX - p.x >= 5);
const pick = (layer: string) => {
  const beat = BEATS.find((b) => b.layer === layer);
  if (!beat) throw new Error(`No reel beat for ${layer}`);
  return beat;
};

export type LinkedInLayer = "Hexbin" | "PositionalHeatmap" | "Voronoi" | "Flow";

const IMAGES: Record<LinkedInLayer, { beat: Beat; code: string }> = {
  Hexbin: {
    beat: pick("Hexbin"),
    code: "<Hexbin data={pressures} x={(p) => p.x} y={(p) => p.y} binsX={12} />",
  },
  PositionalHeatmap: {
    beat: pick("PositionalHeatmap"),
    code: "<PositionalHeatmap data={passes} x={(p) => p.endX} y={(p) => p.endY} />",
  },
  Voronoi: {
    // Stronger cells than the reel: a LinkedIn feed image is seen small.
    beat: { ...pick("Voronoi"), render: (s) => voronoiMarks(s, 0.62) },
    code: "<Voronoi data={players} x={(p) => p.x} y={(p) => p.y} fill={teamColour} />",
  },
  Flow: {
    beat: {
      layer: "Flow",
      headline: "How Spain moved forward",
      chip: { big: String(spainForward.length), label: "forward passes" },
      render: (s) => (
        <Flow
          data={spainForward}
          x={(p) => p.x}
          y={(p) => p.y}
          x2={(p) => p.endX}
          y2={(p) => p.endY}
          binsX={6}
          binsY={4}
          colorMin="#38bdf8"
          colorMax="#fb923c"
          strokeWidthMin={2 * s}
          strokeWidthMax={7 * s}
        />
      ),
    },
    code: "<Flow data={forwardPasses} x={…} y={…} x2={…} y2={…} binsX={6} binsY={4} />",
  },
};

const PITCH_WIDTH = 1000;

export function LinkedInImage({ layer }: { layer: LinkedInLayer }) {
  const { beat, code } = IMAGES[layer];
  return (
    <Backdrop>
      <div style={{ position: "absolute", top: 56, left: 100, right: 100 }}>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 60,
            fontWeight: 600,
            color: C.accent,
            letterSpacing: "-0.03em",
          }}
        >
          &lt;{beat.layer}&gt;
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 62,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
          }}
        >
          {beat.headline}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 52,
                fontWeight: 700,
                color: C.accent,
                letterSpacing: "-0.03em",
              }}
            >
              {beat.chip.big}
            </span>
            <span style={{ fontSize: 28, fontWeight: 600, color: C.muted }}>{beat.chip.label}</span>
          </div>
          {beat.legend && (
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: 22,
                fontSize: 26,
                fontWeight: 600,
                color: C.muted,
              }}
            >
              {beat.legend.map((item) => (
                <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span
                    style={{ width: 18, height: 18, borderRadius: "50%", background: item.color }}
                  />
                  {item.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ position: "absolute", top: 352, left: 100 }}>
        <BeatPitch beat={{ ...beat, layout: "horizontal" }} width={PITCH_WIDTH} />
      </div>
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            left: 100,
            right: 100,
            bottom: 96,
            fontFamily: FONT.mono,
            fontSize: 21,
            color: C.accent,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {code}
        </div>
        <div
          style={{
            position: "absolute",
            left: 100,
            bottom: 44,
            fontFamily: FONT.mono,
            fontSize: 20,
            color: C.faint,
          }}
        >
          Spain 2–1 England · Euro 2024 final · StatsBomb open data
        </div>
        <div
          style={{
            position: "absolute",
            right: 100,
            bottom: 44,
            fontFamily: FONT.mono,
            fontSize: 22,
            color: C.muted,
          }}
        >
          pitchkitjs.com
        </div>
      </AbsoluteFill>
    </Backdrop>
  );
}

export const LinkedInHexbin = () => <LinkedInImage layer="Hexbin" />;
export const LinkedInPositional = () => <LinkedInImage layer="PositionalHeatmap" />;
export const LinkedInVoronoi = () => <LinkedInImage layer="Voronoi" />;
export const LinkedInFlow = () => <LinkedInImage layer="Flow" />;

/** Chart variables for the black background: the gallery's sky and orange, light-on-dark text. */
const momentumVars = {
  "--pitch-series-1": C.sky,
  "--pitch-series-2": C.orange,
  "--pitch-chart-surface": "#000000",
  "--pitch-chart-text": "rgba(238, 245, 241, 0.95)",
  "--pitch-chart-muted": "rgba(238, 245, 241, 0.6)",
  "--pitch-grid": "rgba(255, 255, 255, 0.07)",
  "--pitch-axis": "rgba(255, 255, 255, 0.35)",
} as CSSProperties;

/** The momentum image has its own layout: a chart, not a pitch. */
export function LinkedInMomentum() {
  return (
    <Backdrop>
      <div style={{ position: "absolute", top: 56, left: 100, right: 100 }}>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 60,
            fontWeight: 600,
            color: C.accent,
            letterSpacing: "-0.03em",
          }}
        >
          &lt;MomentumChart&gt;
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 62,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
          }}
        >
          Who had the upper hand
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 20 }}>
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 52,
              fontWeight: 700,
              color: C.accent,
              letterSpacing: "-0.03em",
            }}
          >
            2–1
          </span>
          <span style={{ fontSize: 28, fontWeight: 600, color: C.muted }}>
            Spain v England, minute by minute
          </span>
        </div>
      </div>
      <div style={{ position: "absolute", top: 380, left: 100, width: 1000 }}>
        <div
          style={{
            ...pitchVars,
            ...momentumVars,
            width: 500,
            transform: "scale(2)",
            transformOrigin: "0 0",
          }}
        >
          <MomentumChart
            width={500}
            height={245}
            data={momentum.data}
            period={(d) => d.period}
            time={(d) => d.minute}
            value={(d) => d.value}
            teams={{ home: momentum.home, away: momentum.away }}
            events={momentum.events}
            eventTime={(e) => e.minute}
            eventPeriod={(e) => e.period}
            eventSide={(e) => e.side}
            eventKind={(e) => e.kind}
            eventLabel={(e) => e.label}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 900,
          left: 100,
          right: 100,
          fontSize: 30,
          fontWeight: 600,
          color: C.muted,
          lineHeight: 1.4,
        }}
      >
        Spain above the line, England below. Icons mark goals and cards.
        <div style={{ marginTop: 14, fontSize: 24, color: C.faint }}>
          PitchKit draws momentum, it doesn't invent it: this is derived from on-ball events in the
          attacking third, smoothed over three minutes. A stand-in for pressure, not an official
          metric.
        </div>
      </div>
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            left: 100,
            right: 100,
            bottom: 96,
            fontFamily: FONT.mono,
            fontSize: 21,
            color: C.accent,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {"<MomentumChart data={minutes} period={(d) => d.period} value={(d) => d.value} … />"}
        </div>
        <div
          style={{
            position: "absolute",
            left: 100,
            bottom: 44,
            fontFamily: FONT.mono,
            fontSize: 20,
            color: C.faint,
          }}
        >
          Spain 2–1 England · Euro 2024 final · StatsBomb open data
        </div>
        <div
          style={{
            position: "absolute",
            right: 100,
            bottom: 44,
            fontFamily: FONT.mono,
            fontSize: 22,
            color: C.muted,
          }}
        >
          pitchkitjs.com
        </div>
      </AbsoluteFill>
    </Backdrop>
  );
}
