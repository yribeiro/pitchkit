"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { HeatmapPanel } from "./HeatmapPanel";
import { LineupPanel } from "./LineupPanel";

/** React's CSSProperties has no index signature for custom properties. */
type CSSVars = CSSProperties & Record<`--${string}`, string>;

type GoalType = "line" | "box";

// Selectable heatmap colormaps. "pearlEarring" and "flamingo" are ported
// verbatim (same hex stops) from mplsoccer's own gallery example:
// https://mplsoccer.readthedocs.io/en/latest/gallery/pitch_plots/plot_cmap.html
// — same pair used in packages/core/examples/index.html and examples/react-vite.
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

/**
 * Owns the shared styling-control state (ported from examples/react-vite's
 * App.tsx) and passes resolved appearance/colors down to LineupPanel and
 * HeatmapPanel as plain serializable props. This is itself the "use
 * client" boundary the Pitch tree needs — see LineupPanel.tsx.
 */
export function Controls() {
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
  }

  const appearance = { stripes: stripesEnabled ? stripeCount : false, goalType };
  const heatmapColors = HEATMAP_COLORMAPS[heatmapColormap];

  return (
    <div
      style={
        {
          "--pitch-surface": surface,
          "--pitch-stripe": hexToRgba(stripeColor, stripeOpacity),
          "--pitch-lines": hexToRgba(linesColor, linesOpacity),
        } as CSSVars
      }
    >
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
            <option value="default">default (blue → yellow)</option>
            <option value="pearlEarring">pearl earring</option>
            <option value="flamingo">flamingo</option>
          </select>
        </label>
        <button type="button" style={buttonStyle} onClick={resetControls}>
          Reset
        </button>
      </div>

      <div className="grid">
        <LineupPanel appearance={appearance} />
        <HeatmapPanel
          appearance={appearance}
          colorMin={heatmapColors.colorMin}
          colorMax={heatmapColors.colorMax}
        />
      </div>
    </div>
  );
}
