import type { CSSProperties } from "react";
import { Arrows, Heatmap, Pitch, Scatter } from "@pitchkit/react";

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

export function App() {
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
          // presentation attributes at paint time (PRD §8.7) — no props,
          // no re-render needed for these.
          "--pitch-surface": "#1a472a",
          "--pitch-lines": "rgba(255, 255, 255, 0.8)",
          "--pitch-marker-primary": "#3b82f6",
          "--pitch-marker-goal": "#f97316",
        } as CSSVars
      }
    >
      <h1 style={{ fontSize: "1.1rem", marginBottom: "1.5rem" }}>
        @pitchkit/react — Vite review app
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        <section>
          <h2 style={{ fontSize: "0.85rem", color: "#999", textTransform: "uppercase" }}>
            Responsive Pitch + Scatter + Arrows + tooltip
          </h2>
          <p style={{ fontSize: "0.75rem", color: "#777" }}>
            No width/height props — fills its container via ResizeObserver. Hover a player.
          </p>
          <div style={{ width: "100%", maxWidth: 500 }}>
            <Pitch type="statsbomb" appearance={{ stripes: true }}>
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
          <Pitch type="statsbomb" width={480} height={320}>
            <Heatmap
              data={shots}
              x={(s) => s.x}
              y={(s) => s.y}
              binsX={8}
              binsY={6}
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
      </div>
    </div>
  );
}
