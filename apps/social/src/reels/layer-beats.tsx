/**
 * The eleven beats of reel 03: one PitchKit layer each, every one drawing a
 * real finding from the Euro 2024 final. The numbers on the stat chips come
 * from `layersReel.stats` (scripts/snapshot-layers.mjs), never typed by hand.
 *
 * Conventions: the pitch is turned upright, attacking up the screen; each
 * team's events are recorded attacking left-to-right, so "England mirrored"
 * flips x and y to make them attack the other way.
 */
import type { ReactNode } from "react";
import {
  Arrows,
  Comet,
  ConvexHull,
  Flow,
  GoalAngle,
  Heatmap,
  Hexbin,
  KDE,
  Pitch,
  PositionalHeatmap,
  Scatter,
  Voronoi,
} from "@pitchkit/react";
import { Upright, pitchHeightFor, shotRadius, verticalPitchHeightFor } from "../charts";
import { PitchStage } from "../components/Chrome";
import { finalShots, layersReel as L, spainPasses } from "../data";
import type { Shot } from "../data";
import { appearance, C, densityAppearance, PAD } from "../theme";

const SPAIN = C.sky;
const ENGLAND = "#e2e8f0";
/** Voronoi-only: saturated so the cells read on a phone. */
const V_SPAIN = "#1e6fff";
const V_ENGLAND = "#ff7a00";
const mirror = (s: Shot): Shot => ({ ...s, x: 120 - s.x, y: 80 - s.y });
const st = L.stats;

export interface Beat {
  /** The PitchKit component, shown as `<Name>`. */
  layer: string;
  /** Four or five words. */
  headline: string;
  /** The stat chip: a big figure and a short label. */
  chip: { big: string; label: string };
  density?: boolean;
  /** Colour key shown beside the chip, for beats that use more than one colour. */
  legend?: { color: string; label: string }[];
  /** Crop to a window of the pitch (StatsBomb units) and scale up to fill the width. */
  crop?: { x0: number; x1: number; y0: number; y1: number };
  /**
   * "upright" (default) turns the pitch to attack up the screen; "horizontal"
   * keeps it as recorded, attacking right — used for a half pitch, which is
   * portrait that way round and fills the same space as the full pitch.
   */
  layout?: "upright" | "horizontal";
  /** Pixel width of the pitch, where it differs from the reel's default. */
  width?: number;
  /** A smaller chip, for beats with a long figure. */
  compact?: boolean;
  render: (s: number) => ReactNode;
}

const shotsSpain = finalShots.filter((s) => s.team === "Spain");
const shotsEngland = finalShots.filter((s) => s.team === "England").map(mirror);
const spainComplete = spainPasses.filter((p) => p.complete);
const angles = st.goalAngles;

export const BEATS: Beat[] = [
  {
    layer: "Scatter",
    headline: "Every shot. Both ends.",
    chip: { big: `${st.shots.spain.n} v ${st.shots.england.n}`, label: "shots" },
    legend: [
      { color: SPAIN, label: "ESP" },
      { color: ENGLAND, label: "ENG" },
      { color: C.orange, label: "Goal" },
    ],
    render: (s) => (
      <>
        {[
          { data: shotsSpain, color: SPAIN },
          { data: shotsEngland, color: ENGLAND },
        ].map(({ data, color }) => (
          <Scatter
            key={color}
            data={data}
            x={(x) => x.x}
            y={(x) => x.y}
            r={(x) => shotRadius(x.xg, s * 0.8) + (x.goal ? 4 * s : 0)}
            fill={(x) => (x.goal ? C.orange : color)}
            fillOpacity={(x) => (x.goal ? 1 : 0.65)}
            stroke="white"
            strokeWidth={(x) => (x.goal ? 2.5 * s : 1.5 * s)}
          />
        ))}
      </>
    ),
  },
  {
    layer: "Hexbin",
    headline: "Spain pressed high",
    chip: {
      big: `${st.pressures.spainFinalThird} v ${st.pressures.englandFinalThird}`,
      label: "final-third pressures",
    },
    density: true,
    render: (s) => (
      <Hexbin
        data={L.pressures}
        x={(p) => p.x}
        y={(p) => p.y}
        binsX={12}
        colorMin="#0f3d24"
        colorMax="#facc15"
        stroke="rgba(0, 0, 0, 0.25)"
        strokeWidth={1 * s}
      />
    ),
  },
  {
    layer: "Arrows",
    headline: "Spain's key passes",
    chip: {
      big: `${st.keyPasses.spain} v ${st.keyPasses.england}`,
      label: "key passes · ESP v ENG",
    },
    render: (s) => (
      <>
        <Arrows
          data={L.keyArrows}
          x={(k) => k.x}
          y={(k) => k.y}
          x2={(k) => k.endX}
          y2={(k) => k.endY}
          stroke={(k) => (k.assist ? C.orange : "white")}
          strokeWidth={(k) => (k.assist ? 5 * s : 3.2 * s)}
          strokeOpacity={0.95}
          headSize={(k) => (k.assist ? 17 * s : 12 * s)}
        />
        <Scatter
          data={L.keyArrows}
          x={(k) => k.x}
          y={(k) => k.y}
          r={5 * s}
          fill="white"
          stroke="rgba(0,0,0,0.85)"
          strokeWidth={1.5 * s}
        />
      </>
    ),
  },
  {
    layer: "Comet",
    headline: "Spain carried it forward",
    chip: {
      big: `${st.carries.spain} v ${st.carries.england}`,
      label: "forward carries · ESP v ENG",
    },
    render: (s) => (
      <Comet
        data={L.carries}
        x={(c) => c.x}
        y={(c) => c.y}
        x2={(c) => c.endX}
        y2={(c) => c.endY}
        color={C.accent}
        gradient
        endWidth={10 * s}
      />
    ),
  },
  {
    layer: "Heatmap",
    headline: "Where Spain stood",
    chip: { big: st.positions.n.toLocaleString("en-GB"), label: "tracked player positions" },
    density: true,
    render: () => (
      <Heatmap
        data={L.positions}
        x={(p) => p[0]}
        y={(p) => p[1]}
        binsX={15}
        binsY={10}
        colorMin="#0f3d24"
        colorMax="#fb923c"
      />
    ),
  },
  {
    layer: "KDE",
    headline: "Two wingers. Two flanks.",
    chip: {
      big: `${st.touches.yamal} · ${st.touches.williams}`,
      label: "touches",
    },
    legend: [
      { color: "#f472b6", label: "Yamal" },
      { color: "#38bdf8", label: "Williams" },
    ],
    density: true,
    render: () => (
      <>
        <KDE
          data={L.yamal}
          x={(p) => p.x}
          y={(p) => p.y}
          resolution={140}
          colorMin="#0f3d24"
          colorMax="#f472b6"
          maxOpacity={0.95}
        />
        <KDE
          data={L.williams}
          x={(p) => p.x}
          y={(p) => p.y}
          resolution={140}
          colorMin="#0f3d24"
          colorMax="#38bdf8"
          maxOpacity={0.95}
        />
      </>
    ),
  },
  {
    layer: "PositionalHeatmap",
    headline: "Spain's favourite zone",
    chip: { big: `${st.zone.spain.pct}%`, label: "of passes landed here" },
    density: true,
    render: (s) => (
      <PositionalHeatmap
        data={spainComplete}
        x={(p) => p.endX}
        y={(p) => p.endY}
        colorMin="#0f3d24"
        colorMax={C.sky}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1.2 * s}
      />
    ),
  },
  {
    layer: "Flow",
    headline: "England went direct",
    chip: {
      big: `${st.direct.england}% v ${st.direct.spain}%`,
      label: "direct passes · ENG v ESP",
    },
    render: (s) => (
      <Flow
        data={L.englandFlow}
        x={(p) => p.x}
        y={(p) => p.y}
        x2={(p) => p.endX}
        y2={(p) => p.endY}
        binsX={6}
        binsY={4}
        colorMin="#5f7d6d"
        colorMax={C.accent}
        strokeWidthMin={2.5 * s}
        strokeWidthMax={8 * s}
      />
    ),
  },
  {
    layer: "Voronoi",
    headline: `${st.voronoi.secondsBefore} seconds before the goal`,
    chip: { big: `${st.voronoi.spainSharePct}%`, label: "of the pitch · Spain" },
    legend: [
      { color: "#ffffff", label: st.voronoi.player },
      { color: V_SPAIN, label: "ESP" },
      { color: V_ENGLAND, label: "ENG" },
    ],
    render: (s) => (
      <>
        <Voronoi
          data={L.voronoiSites}
          x={(p) => p.x}
          y={(p) => p.y}
          fill={(p) => (p.spain ? V_SPAIN : V_ENGLAND)}
          fillOpacity={0.85}
          stroke="rgba(0,0,0,0.7)"
          strokeWidth={1.2 * s}
        />
        <Scatter
          data={L.voronoiSites}
          x={(p) => p.x}
          y={(p) => p.y}
          r={(p) => (p.actor ? 12 * s : 7.5 * s)}
          fill={(p) => (p.actor ? "white" : p.spain ? "#0b2a7a" : "#7a2e00")}
          stroke={(p) => (p.actor ? V_SPAIN : "rgba(255,255,255,0.95)")}
          strokeWidth={(p) => (p.actor ? 4 * s : 2 * s)}
        />
      </>
    ),
  },
  {
    layer: "ConvexHull",
    headline: "Spain squeezed higher",
    chip: { big: `+${st.shape.diff}`, label: "units higher" },
    legend: [
      { color: SPAIN, label: "ESP" },
      { color: ENGLAND, label: "ENG" },
    ],
    render: (s) => (
      <>
        {[
          { players: L.shape.england, color: ENGLAND },
          { players: L.shape.spain, color: SPAIN },
        ].map(({ players, color }) => (
          <g key={color}>
            <ConvexHull
              data={players}
              x={(p) => p.x}
              y={(p) => p.y}
              fill={color}
              fillOpacity={0.16}
              stroke={color}
              strokeWidth={3 * s}
            />
            <Scatter
              data={players}
              x={(p) => p.x}
              y={(p) => p.y}
              r={7 * s}
              fill={color}
              stroke="rgba(0,0,0,0.8)"
              strokeWidth={1.5 * s}
            />
          </g>
        ))}
      </>
    ),
  },
  {
    layer: "GoalAngle",
    headline: "Three goals. Three angles.",
    chip: {
      big: angles.map((g) => `${g.angle}°`).join(" · "),
      label: angles.map((g) => g.player).join(" · "),
    },
    compact: true,
    // The attacking half, drawn as recorded (goal on the right): portrait, so
    // it fills the space the full upright pitch does.
    layout: "horizontal",
    width: 640,
    crop: { x0: 60, x1: 120, y0: 0, y1: 80 },
    render: (s) => (
      <>
        <GoalAngle
          data={angles}
          x={(g) => g.x}
          y={(g) => g.y}
          goal="right"
          fill={C.orange}
          fillOpacity={0.28}
          stroke={C.orange}
          strokeWidth={1.5 * s}
        />
        <Scatter
          data={angles}
          x={(g) => g.x}
          y={(g) => g.y}
          r={9 * s}
          fill={C.orange}
          stroke="white"
          strokeWidth={2 * s}
        />
      </>
    ),
  },
];

/**
 * A beat's pitch: by default a horizontal pitch turned to attack up the screen.
 * With a `crop`, only that window is drawn and scaled up to fill the width — the
 * `s` handed to `render` grows with it, so marks stay in proportion.
 */
export function BeatPitch({ beat, width }: { beat: Beat; width: number }) {
  const { crop } = beat;
  if (beat.layout === "horizontal") {
    // Drawn as recorded: width runs along x, height along y.
    const window = crop ?? { x0: 0, x1: 120, y0: 0, y1: 80 };
    const k = (width - PAD.left - PAD.right) / (window.x1 - window.x0);
    const height = (window.y1 - window.y0) * k + PAD.top + PAD.bottom;
    return (
      <PitchStage>
        <Pitch
          type="statsbomb"
          width={width}
          height={height}
          padding={PAD}
          crop={crop}
          appearance={beat.density ? densityAppearance : appearance}
        >
          {beat.render(k / 8.33)}
        </Pitch>
      </PitchStage>
    );
  }
  // Upright: screen width runs along the pitch's short axis (y), height along x.
  const k = crop
    ? (width - PAD.top - PAD.bottom) / (crop.y1 - crop.y0)
    : (verticalPitchHeightFor(width) - PAD.left - PAD.right) / 120;
  const long = crop
    ? (crop.x1 - crop.x0) * k + PAD.left + PAD.right
    : verticalPitchHeightFor(width);
  const short = crop ? width : pitchHeightFor(long);
  return (
    <PitchStage>
      <Upright width={short} height={long}>
        <Pitch
          type="statsbomb"
          width={long}
          height={short}
          padding={PAD}
          crop={crop}
          appearance={beat.density ? densityAppearance : appearance}
        >
          {beat.render(k / 8.33)}
        </Pitch>
      </Upright>
    </PitchStage>
  );
}
