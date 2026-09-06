import { useState } from "react";
import type { CSSProperties } from "react";
import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import {
  Arrows,
  ConvexHull,
  Flow,
  GoalAngle,
  Heatmap,
  Pitch,
  Polygon,
  Scatter,
  VerticalPitch,
  Voronoi,
} from "@pitchkit/react";

/** React's CSSProperties has no index signature for custom properties. */
type CSSVars = CSSProperties & Record<`--${string}`, string>;

interface Player {
  name: string;
  x: number;
  y: number;
}

interface Shot {
  x: number;
  y: number;
}

// StatsBomb coordinates (120 x 80).
const players: Player[] = [
  { name: "GK", x: 20, y: 40 },
  { name: "LB", x: 35, y: 15 },
  { name: "RB", x: 35, y: 65 },
  { name: "CB", x: 35, y: 40 },
  { name: "CM", x: 60, y: 40 },
  { name: "FW", x: 90, y: 25 },
];

const passes = [
  { from: players[0], to: players[3] },
  { from: players[3], to: players[1] },
  { from: players[3], to: players[2] },
  { from: players[1], to: players[4] },
  { from: players[4], to: players[5] },
].filter((p): p is { from: Player; to: Player } => p.from !== undefined && p.to !== undefined);

const shots: Shot[] = [
  { x: 95, y: 35 },
  { x: 98, y: 40 },
  { x: 101, y: 38 },
  { x: 104, y: 42 },
  { x: 110, y: 39 },
  { x: 108, y: 36 },
  { x: 99, y: 45 },
  { x: 60, y: 40 },
  { x: 65, y: 35 },
];

// Touch map for the convex hull / Voronoi sections below.
const touches: Player[] = [
  { name: "P1", x: 30, y: 15 },
  { name: "P2", x: 55, y: 10 },
  { name: "P3", x: 75, y: 25 },
  { name: "P4", x: 80, y: 55 },
  { name: "P5", x: 60, y: 68 },
  { name: "P6", x: 35, y: 60 },
  { name: "P7", x: 55, y: 38 }, // interior, excluded from the hull
];

// A denser pass cluster for the flow diagram, upfield-moving.
const flowPasses = [
  { from: { x: 20, y: 40 }, to: { x: 45, y: 35 } },
  { from: { x: 22, y: 42 }, to: { x: 48, y: 38 } },
  { from: { x: 18, y: 38 }, to: { x: 42, y: 30 } },
  { from: { x: 60, y: 30 }, to: { x: 85, y: 25 } },
  { from: { x: 62, y: 32 }, to: { x: 88, y: 22 } },
  { from: { x: 95, y: 60 }, to: { x: 105, y: 45 } },
  { from: { x: 30, y: 65 }, to: { x: 55, y: 60 } },
];

const highlightZone = [
  {
    vertices: [
      [80, 18],
      [120, 18],
      [120, 62],
      [80, 62],
    ] as const,
  },
];

const statsbombDimensions = getPitchDimensions("statsbomb");

type Team = "home" | "away";
interface TeamPlayer extends Player {
  team: Team;
}
const TEAM_COLOR: Record<Team, string> = { home: "#3b82f6", away: "#f97316" };

// Two opposing back lines, so Voronoi cells read as which team controls
// which space rather than one undifferentiated mesh.
const teamPlayers: TeamPlayer[] = [
  { name: "LB", team: "home", x: 40, y: 15 },
  { name: "CB", team: "home", x: 35, y: 35 },
  { name: "CB", team: "home", x: 35, y: 55 },
  { name: "RB", team: "home", x: 40, y: 70 },
  { name: "LB", team: "away", x: 80, y: 15 },
  { name: "CB", team: "away", x: 85, y: 35 },
  { name: "CB", team: "away", x: 85, y: 55 },
  { name: "RB", team: "away", x: 80, y: 70 },
];

type GoalSide = "nearest" | "left" | "right";
type GoalType = "line" | "box";

// Selectable heatmap colormaps. "pearlEarring" and "flamingo" are ported
// verbatim (same hex stops) from mplsoccer's own gallery example:
// https://mplsoccer.readthedocs.io/en/latest/gallery/pitch_plots/plot_cmap.html
// — same pair used in packages/core/examples/index.html.
const HEATMAP_COLORMAPS = {
  default: { colorMin: "#1d4ed8", colorMax: "#facc15" },
  pearlEarring: { colorMin: "#15242e", colorMax: "#4393c4" },
  flamingo: { colorMin: "#e3aca7", colorMax: "#c03a1d" },
} as const;
type HeatmapColormapKey = keyof typeof HEATMAP_COLORMAPS;

const DEFAULT_CONTROLS = {
  surface: "#1a472a",
  stripeColor: "#ffffff",
  stripeOpacity: 0.05,
  linesColor: "#ffffff",
  linesOpacity: 0.8,
  stripesEnabled: true,
  stripeCount: 12,
  goalType: "box" as GoalType,
  heatmapColormap: "default" as HeatmapColormapKey,
  goalAngleSide: "nearest" as GoalSide,
  flowBinsX: 8,
  flowBinsY: 6,
  polygonOpacity: 0.35,
};

/** "#rrggbb" + 0-1 opacity -> "rgba(r, g, b, a)", for compositing into a CSS var. */
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const controlsStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 1,
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "1.25rem",
  margin: "0 0 1.5rem",
  padding: "0.85rem 1rem",
  background: "#1b1b1b",
  border: "1px solid #333",
  borderRadius: 6,
};
const fieldStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  fontSize: "0.8rem",
  color: "#bbb",
};
const colorInputStyle: CSSProperties = {
  width: "1.6rem",
  height: "1.6rem",
  padding: 0,
  border: "1px solid #444",
  borderRadius: 4,
  background: "none",
  cursor: "pointer",
};
const rangeInputStyle: CSSProperties = { width: "5rem" };
const numberInputStyle: CSSProperties = {
  width: "3.5rem",
  background: "#111",
  color: "#eee",
  border: "1px solid #444",
  borderRadius: 4,
  padding: "0.15rem 0.3rem",
};
const selectStyle: CSSProperties = {
  background: "#111",
  color: "#eee",
  border: "1px solid #444",
  borderRadius: 4,
  padding: "0.15rem 0.3rem",
};
const buttonStyle: CSSProperties = {
  fontSize: "0.8rem",
  color: "#eee",
  background: "#2a2a2a",
  border: "1px solid #444",
  borderRadius: 4,
  padding: "0.35rem 0.7rem",
  cursor: "pointer",
};

export function App() {
  const [surface, setSurface] = useState(DEFAULT_CONTROLS.surface);
  const [stripeColor, setStripeColor] = useState(DEFAULT_CONTROLS.stripeColor);
  const [stripeOpacity, setStripeOpacity] = useState(DEFAULT_CONTROLS.stripeOpacity);
  const [linesColor, setLinesColor] = useState(DEFAULT_CONTROLS.linesColor);
  const [linesOpacity, setLinesOpacity] = useState(DEFAULT_CONTROLS.linesOpacity);
  const [stripesEnabled, setStripesEnabled] = useState(DEFAULT_CONTROLS.stripesEnabled);
  const [stripeCount, setStripeCount] = useState(DEFAULT_CONTROLS.stripeCount);
  const [goalType, setGoalType] = useState<GoalType>(DEFAULT_CONTROLS.goalType);
  const [heatmapColormap, setHeatmapColormap] = useState<HeatmapColormapKey>(
    DEFAULT_CONTROLS.heatmapColormap,
  );
  const [goalAngleSide, setGoalAngleSide] = useState<GoalSide>(DEFAULT_CONTROLS.goalAngleSide);
  const [flowBinsX, setFlowBinsX] = useState(DEFAULT_CONTROLS.flowBinsX);
  const [flowBinsY, setFlowBinsY] = useState(DEFAULT_CONTROLS.flowBinsY);
  const [polygonOpacity, setPolygonOpacity] = useState(DEFAULT_CONTROLS.polygonOpacity);

  function resetControls() {
    setSurface(DEFAULT_CONTROLS.surface);
    setStripeColor(DEFAULT_CONTROLS.stripeColor);
    setStripeOpacity(DEFAULT_CONTROLS.stripeOpacity);
    setLinesColor(DEFAULT_CONTROLS.linesColor);
    setLinesOpacity(DEFAULT_CONTROLS.linesOpacity);
    setStripesEnabled(DEFAULT_CONTROLS.stripesEnabled);
    setStripeCount(DEFAULT_CONTROLS.stripeCount);
    setGoalType(DEFAULT_CONTROLS.goalType);
    setHeatmapColormap(DEFAULT_CONTROLS.heatmapColormap);
    setGoalAngleSide(DEFAULT_CONTROLS.goalAngleSide);
    setFlowBinsX(DEFAULT_CONTROLS.flowBinsX);
    setFlowBinsY(DEFAULT_CONTROLS.flowBinsY);
    setPolygonOpacity(DEFAULT_CONTROLS.polygonOpacity);
  }

  // Stripes/goalType are baked into the SVG shapes at paint time (not CSS),
  // so this is passed as a prop to every <Pitch> below and React re-renders
  // them declaratively — no renderAll()-style imperative rebuild needed,
  // unlike packages/core/examples/index.html's vanilla-JS equivalent.
  const appearance = { stripes: stripesEnabled ? stripeCount : false, goalType };
  const heatmapColors = HEATMAP_COLORMAPS[heatmapColormap];

  return (
    <div
      style={
        {
          minHeight: "100vh",
          background: "#111",
          color: "#eee",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          // Theming demo: CSS variables cascade into the Pitch's SVG
          // presentation attributes at paint time (PRD §8.7) — no re-render
          // needed for these, unlike stripes/goalType above.
          "--pitch-surface": surface,
          "--pitch-stripe": hexToRgba(stripeColor, stripeOpacity),
          "--pitch-lines": hexToRgba(linesColor, linesOpacity),
          "--pitch-marker-primary": "#3b82f6",
          "--pitch-marker-goal": "#f97316",
        } as CSSVars
      }
    >
      <h1 style={{ fontSize: "1.1rem", marginBottom: "1.5rem" }}>
        @pitchkit/react — Vite review app
      </h1>

      <div style={controlsStyle}>
        <label style={fieldStyle}>
          Surface
          <input
            type="color"
            style={colorInputStyle}
            value={surface}
            onChange={(e) => setSurface(e.target.value)}
          />
        </label>
        <label style={fieldStyle}>
          Stripe
          <input
            type="color"
            style={colorInputStyle}
            value={stripeColor}
            onChange={(e) => setStripeColor(e.target.value)}
          />
          <input
            type="range"
            style={rangeInputStyle}
            min={0}
            max={1}
            step={0.01}
            value={stripeOpacity}
            onChange={(e) => setStripeOpacity(Number(e.target.value))}
          />
        </label>
        <label style={fieldStyle}>
          Lines
          <input
            type="color"
            style={colorInputStyle}
            value={linesColor}
            onChange={(e) => setLinesColor(e.target.value)}
          />
          <input
            type="range"
            style={rangeInputStyle}
            min={0}
            max={1}
            step={0.01}
            value={linesOpacity}
            onChange={(e) => setLinesOpacity(Number(e.target.value))}
          />
        </label>
        <label style={fieldStyle}>
          <input
            type="checkbox"
            checked={stripesEnabled}
            onChange={(e) => setStripesEnabled(e.target.checked)}
          />
          Stripes
        </label>
        <label style={fieldStyle}>
          Count
          <input
            type="number"
            style={numberInputStyle}
            min={2}
            max={24}
            step={2}
            value={stripeCount}
            disabled={!stripesEnabled}
            onChange={(e) => setStripeCount(Number(e.target.value))}
          />
        </label>
        <label style={fieldStyle}>
          Goal type
          <select
            style={selectStyle}
            value={goalType}
            onChange={(e) => setGoalType(e.target.value as GoalType)}
          >
            <option value="line">line</option>
            <option value="box">box</option>
          </select>
        </label>
        <label style={fieldStyle}>
          Heatmap
          <select
            style={selectStyle}
            value={heatmapColormap}
            onChange={(e) => setHeatmapColormap(e.target.value as HeatmapColormapKey)}
          >
            <option value="default">default (blue → red)</option>
            <option value="pearlEarring">pearl earring</option>
            <option value="flamingo">flamingo</option>
          </select>
        </label>
        <label style={fieldStyle}>
          Goal angle side
          <select
            style={selectStyle}
            value={goalAngleSide}
            onChange={(e) => setGoalAngleSide(e.target.value as GoalSide)}
          >
            <option value="nearest">nearest</option>
            <option value="left">left</option>
            <option value="right">right</option>
          </select>
        </label>
        <label style={fieldStyle}>
          Flow bins
          <input
            type="number"
            style={numberInputStyle}
            min={2}
            max={16}
            value={flowBinsX}
            onChange={(e) => setFlowBinsX(Number(e.target.value))}
          />
          x
          <input
            type="number"
            style={numberInputStyle}
            min={2}
            max={16}
            value={flowBinsY}
            onChange={(e) => setFlowBinsY(Number(e.target.value))}
          />
        </label>
        <label style={fieldStyle}>
          Zone opacity
          <input
            type="range"
            style={rangeInputStyle}
            min={0}
            max={1}
            step={0.05}
            value={polygonOpacity}
            onChange={(e) => setPolygonOpacity(Number(e.target.value))}
          />
        </label>
        <button type="button" style={buttonStyle} onClick={resetControls}>
          Reset
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        <section>
          <h2 style={{ fontSize: "0.85rem", color: "#999", textTransform: "uppercase" }}>
            Responsive Pitch + Scatter + Arrows + tooltip
          </h2>
          <p style={{ fontSize: "0.75rem", color: "#777" }}>
            No width/height props — fills its container via ResizeObserver. Hover a player.
          </p>
          <div style={{ width: "100%", maxWidth: 500 }}>
            <Pitch type="statsbomb" appearance={appearance}>
              <Arrows
                data={passes}
                x={(p) => p.from.x}
                y={(p) => p.from.y}
                x2={(p) => p.to.x}
                y2={(p) => p.to.y}
                strokeOpacity={0.5}
              />
              <Scatter
                data={players}
                x={(p) => p.x}
                y={(p) => p.y}
                r={7}
                stroke="white"
                strokeWidth={2}
                tooltip={(p) => p.name}
              />
            </Pitch>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: "0.85rem", color: "#999", textTransform: "uppercase" }}>
            Fixed-size Pitch + Heatmap
          </h2>
          <p style={{ fontSize: "0.75rem", color: "#777" }}>
            Explicit width/height (the responsive opt-out). Canvas heatmap composited via
            &lt;foreignObject&gt;, no manual DOM stacking required.
          </p>
          <Pitch type="statsbomb" width={480} height={320} appearance={appearance}>
            <Heatmap
              data={shots}
              x={(s) => s.x}
              y={(s) => s.y}
              binsX={8}
              binsY={6}
              colorMin={heatmapColors.colorMin}
              colorMax={heatmapColors.colorMax}
              style={{ opacity: 0.75 }}
            />
            <Scatter
              data={shots}
              x={(s) => s.x}
              y={(s) => s.y}
              r={2}
              fill="white"
              fillOpacity={0.7}
            />
          </Pitch>
        </section>

        <section>
          <h2 style={{ fontSize: "0.85rem", color: "#999", textTransform: "uppercase" }}>
            Convex Hull + Scatter
          </h2>
          <p style={{ fontSize: "0.75rem", color: "#777" }}>
            One filled polygon around a touch map's outermost points.
          </p>
          <div style={{ width: "100%", maxWidth: 500 }}>
            <Pitch type="statsbomb" appearance={appearance}>
              <ConvexHull data={touches} x={(t) => t.x} y={(t) => t.y} />
              <Scatter data={touches} x={(t) => t.x} y={(t) => t.y} r={3} tooltip={(t) => t.name} />
            </Pitch>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: "0.85rem", color: "#999", textTransform: "uppercase" }}>
            Voronoi + Scatter
          </h2>
          <p style={{ fontSize: "0.75rem", color: "#777" }}>
            One cell per player, clipped to the pitch outline, colored per team. Hover a cell.
          </p>
          <div style={{ width: "100%", maxWidth: 500 }}>
            <Pitch type="statsbomb" appearance={appearance}>
              <Voronoi
                data={teamPlayers}
                x={(p) => p.x}
                y={(p) => p.y}
                fill={(p) => TEAM_COLOR[p.team]}
                tooltip={(p) => `${p.team} ${p.name}`}
              />
              <Scatter
                data={teamPlayers}
                x={(p) => p.x}
                y={(p) => p.y}
                r={4}
                stroke="white"
                strokeWidth={1.5}
              />
            </Pitch>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: "0.85rem", color: "#999", textTransform: "uppercase" }}>
            Goal Angle + Scatter
          </h2>
          <p style={{ fontSize: "0.75rem", color: "#777" }}>
            Wedge from each shot to both goalposts. Use the "Goal angle side" control above.
          </p>
          <div style={{ width: "100%", maxWidth: 500 }}>
            <Pitch type="statsbomb" appearance={appearance}>
              <GoalAngle data={shots} x={(s) => s.x} y={(s) => s.y} goal={goalAngleSide} />
              <Scatter data={shots} x={(s) => s.x} y={(s) => s.y} r={2} fill="white" />
            </Pitch>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: "0.85rem", color: "#999", textTransform: "uppercase" }}>
            Flow diagram
          </h2>
          <p style={{ fontSize: "0.75rem", color: "#777" }}>
            One arrow per occupied bin, colored/sized by volume. Use the "Flow bins" control above.
          </p>
          <div style={{ width: "100%", maxWidth: 500 }}>
            <Pitch type="statsbomb" appearance={appearance}>
              <Flow
                data={flowPasses}
                x={(p) => p.from.x}
                y={(p) => p.from.y}
                x2={(p) => p.to.x}
                y2={(p) => p.to.y}
                binsX={flowBinsX}
                binsY={flowBinsY}
              />
            </Pitch>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: "0.85rem", color: "#999", textTransform: "uppercase" }}>
            Polygon
          </h2>
          <p style={{ fontSize: "0.75rem", color: "#777" }}>
            A static highlighted zone, cropped to the attacking half and rotated vertical. Use
            the "Zone opacity" control above.
          </p>
          <div style={{ width: "100%", maxWidth: 250 }}>
            <VerticalPitch
              type="statsbomb"
              appearance={appearance}
              crop={cropForHalf(statsbombDimensions)}
            >
              <Polygon
                data={highlightZone}
                points={(z) => z.vertices}
                fillOpacity={polygonOpacity}
              />
            </VerticalPitch>
          </div>
        </section>
      </div>
    </div>
  );
}
