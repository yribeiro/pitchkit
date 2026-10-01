import { matchMinuteTicks, niceTicks } from "@pitchkit/core";
import { useRaceChartContext } from "./race-context.js";
import type { RaceAppearance } from "./race-types.js";

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
  const { frame, scaleX, scaleY, endTime } = useRaceChartContext();
  const showX = appearance.axis === "both" || appearance.axis === "x";
  const showY = appearance.axis === "both" || appearance.axis === "y";

  const valueTicks = niceTicks(scaleY.domain[0], scaleY.domain[1]);
  const minuteTicks = matchMinuteTicks(endTime);

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
        minuteTicks.map((minute) => (
          <text
            key={`xtick-${minute}`}
            data-pitchkit-part="race-label"
            x={scaleX(minute)}
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
 * Vertical rules at each period boundary.
 *
 * Derived from the data rather than drawn at a fixed 45, because halves do
 * not end on 45: stoppage time is inside StatsBomb's own `minute`
 * numbering, so a real first half runs to 47' as readily as 45'
 * (docs/architecture.md, data provider facts). With no `period` accessor
 * there is nothing to derive from, so nothing is drawn — a rule in the
 * wrong place is worse than no rule.
 */
export function RacePeriodBreaks({ breaks }: { breaks: readonly number[] }) {
  const { frame, scaleX } = useRaceChartContext();

  return (
    <g data-pitchkit-part="race-period">
      {breaks.map((minute, i) => (
        <g key={minute}>
          <line
            x1={scaleX(minute)}
            y1={frame.y0}
            x2={scaleX(minute)}
            y2={frame.y1}
            style={{ stroke: AXIS, strokeWidth: 1 }}
          />
          <text
            x={scaleX(minute)}
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
  const { frame, series } = useRaceChartContext();

  // Laid out with a running offset computed up front rather than mutated
  // during the map — the React Compiler rejects reassignment across a
  // render, and a precomputed array is clearer anyway.
  const positions = series.reduce<number[]>((acc, s, i) => {
    const previous = acc[i - 1] ?? frame.x0;
    const previousWidth = i === 0 ? 0 : (series[i - 1]?.label.length ?? 0) * 6.5 + 34;
    acc.push(previous + previousWidth);
    return acc;
  }, []);

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
