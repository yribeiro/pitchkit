import { matchMinuteTicks, niceTicks } from "@pitchkit/core";
import { useRaceChart } from "./race-context.js";
import type { RaceAppearance } from "./race-types.js";

import { legendOffsets } from "./chart-readout.js";
import { AXIS, CHART_MUTED as MUTED, CHART_TEXT, GRID } from "./chart-tokens.js";

/**
 * Gridlines, ticks and the baseline.
 *
 * Every colour here is a CSS variable with no prop equivalent, on purpose:
 * chart chrome is the counterpart to the pitch background, which
 * `docs/architecture.md` keeps out of the `className` path entirely. It is
 * not a mark, so it is restyled through variables only.
 *
 * Gridlines are solid hairlines rather than dashed — dashing adds ink that
 * isn't data and reads as noise behind a step line that is itself made of
 * horizontal segments.
 */
export function RaceGridAndAxes({ appearance }: { appearance: Required<RaceAppearance> }) {
  const { frame, panels, scaleY } = useRaceChart();
  const showX = appearance.axis === "both" || appearance.axis === "x";
  const showY = appearance.axis === "both" || appearance.axis === "y";

  const valueTicks = niceTicks(scaleY.domain[0], scaleY.domain[1]);
  // Each period ticks its own minutes. The boundary minute is drawn once,
  // at the end of the period before it, not again at the next one's start.
  const minuteTicks = panels.flatMap((panel) =>
    matchMinuteTicks(panel.end)
      .filter((m) => m >= panel.start && m <= panel.end && (panel.index === 0 || m > panel.start))
      .map((minute) => ({ minute, x: panel.scale(minute) })),
  );

  return (
    <g data-pitchkit-part="race-axis">
      {appearance.grid &&
        valueTicks.map((tick) => {
          // The zero line is the baseline, drawn below in the axis colour.
          if (tick === scaleY.domain[0]) return null;
          return (
            <line
              key={`grid-${tick}`}
              data-pitchkit-part="race-grid"
              x1={frame.x0}
              y1={scaleY(tick)}
              x2={frame.x1}
              y2={scaleY(tick)}
              style={{ stroke: GRID, strokeWidth: 1 }}
            />
          );
        })}

      {showY &&
        valueTicks.map((tick) => (
          <text
            key={`ytick-${tick}`}
            data-pitchkit-part="race-label"
            x={frame.x0 - 8}
            y={scaleY(tick) + 3.5}
            textAnchor="end"
            style={{ fill: MUTED, fontSize: 10 }}
          >
            {tick}
          </text>
        ))}

      <line
        x1={frame.x0}
        y1={scaleY(scaleY.domain[0])}
        x2={frame.x1}
        y2={scaleY(scaleY.domain[0])}
        style={{ stroke: AXIS, strokeWidth: 1 }}
      />

      {showX &&
        minuteTicks.map(({ minute, x }) => (
          <text
            key={`xtick-${x}`}
            data-pitchkit-part="race-label"
            x={x}
            y={frame.y1 + 18}
            textAnchor="middle"
            style={{ fill: MUTED, fontSize: 10 }}
          >
            {`${minute}'`}
          </text>
        ))}
    </g>
  );
}

/**
 * Vertical rules where one period ends and the next starts.
 *
 * Not at a fixed 45: stoppage time is inside the feed's own `minute`
 * numbering, so a real first half runs to 47' as readily as 45'
 * (docs/architecture.md, data provider facts), and each period's panel is
 * as wide as its own minutes.
 */
export function RacePeriodBreaks() {
  const { frame, panels } = useRaceChart();

  return (
    <g data-pitchkit-part="race-period">
      {panels.slice(1).map(({ x0 }, i) => (
        <g key={x0}>
          <line
            x1={x0}
            y1={frame.y0}
            x2={x0}
            y2={frame.y1}
            style={{ stroke: AXIS, strokeWidth: 1 }}
          />
          <text
            x={x0}
            y={frame.y0 - 6}
            textAnchor="middle"
            style={{ fill: MUTED, fontSize: 9.5, letterSpacing: "0.05em" }}
          >
            {i === 0 ? "HT" : `P${i + 2}`}
          </text>
        </g>
      ))}
    </g>
  );
}

/**
 * The legend. Always present for two or more series and omitted for one —
 * with a single line the chart's own heading already names it, and a
 * one-swatch box restates the title for the cost of a row.
 *
 * The label wears a text colour, never the series colour; identity comes
 * from the line-key beside it. A light categorical hue is illegible as
 * text on a light surface.
 */
export function RaceLegend({ colors }: { colors: readonly string[] }) {
  const { frame, series } = useRaceChart();

  const positions = legendOffsets(
    series.map((s) => s.label),
    11,
    34,
    frame.x0,
  );

  return (
    <g data-pitchkit-part="race-legend">
      {series.map((s, i) => {
        const x = positions[i] ?? frame.x0;
        return (
          <g key={s.id}>
            <rect
              x={x}
              y={frame.y0 - 24}
              width={14}
              height={2.5}
              rx={1.25}
              style={{ fill: s.color ?? colors[i] }}
            />
            <text
              x={x + 20}
              y={frame.y0 - 19}
              style={{
                fill: CHART_TEXT,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {s.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
