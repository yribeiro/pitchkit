import { LABEL_LINE_HEIGHT, axisAngle, normaliseMetric, polarPoint } from "@pitchkit/core";
import type { NormalisedValue, PolarRange, Point } from "@pitchkit/core";
import { ReadoutRow, legendOffsets } from "./chart-readout.js";
import { CHART_TEXT } from "./chart-tokens.js";
import type { Paint } from "./chart-tokens.js";

/** The pieces RadarChart and PizzaChart share. Internal: not exported from the package. */

/** Space between the rim and a label. */
export const LABEL_GAP = 8;
export const LEGEND_HEIGHT = 24;
/** Legend swatch, its gap to the label, and the gap to the next entry. */
const LEGEND_ENTRY_PAD = 33;

/** At most two decimals, with trailing zeros dropped. */
export function formatValue(value: number): string {
  return String(Number(value.toFixed(2)));
}

export interface LegendEntry extends Paint {
  readonly key: string;
  readonly label: string;
}

/** A row of swatches and names across the top of the chart. */
export function ChartLegend({
  part,
  entries,
  fontSize,
}: {
  part: string;
  entries: readonly LegendEntry[];
  fontSize: number;
}) {
  // Each entry starts where the last one's estimated width ends.
  const x = legendOffsets(
    entries.map((e) => e.label),
    fontSize + 1,
    LEGEND_ENTRY_PAD,
    4,
  );
  return (
    <g data-pitchkit-part={part} style={{ fontSize: fontSize + 1 }}>
      {entries.map((entry, i) => (
        <g
          key={entry.key}
          className={entry.className}
          style={{ color: entry.color }}
          transform={`translate(${x[i]} 12)`}
        >
          <rect y={-5} width={10} height={10} rx={2} style={{ fill: "currentColor" }} />
          <text x={15} dy="0.35em" style={{ fill: CHART_TEXT, fontWeight: 600 }}>
            {entry.label}
          </text>
        </g>
      ))}
    </g>
  );
}

/** A label's wrapped lines, the first at the placement's offset. */
export function LabelTspans({ lines, dy }: { lines: readonly string[]; dy: number }) {
  return lines.map((line, k) => (
    <tspan key={k} x={0} dy={`${k === 0 ? dy : LABEL_LINE_HEIGHT}em`}>
      {line}
    </tspan>
  ));
}

export interface MetricReadoutRow extends Paint {
  readonly key: string;
  readonly label: string;
  readonly value: number | undefined;
  readonly clamped: boolean;
}

/** The readout body: the metric's name, then each series' value. */
export function MetricReadout({
  title,
  lowerIsBetter,
  rows,
  format,
}: {
  title: string;
  lowerIsBetter: boolean | undefined;
  rows: readonly MetricReadoutRow[];
  format: (value: number) => string;
}) {
  return (
    <>
      <div style={{ fontWeight: 600 }}>
        {title}
        {lowerIsBetter && <span style={{ opacity: 0.7, fontWeight: 400 }}> · lower is better</span>}
      </div>
      {rows.map((r) => (
        <ReadoutRow
          key={r.key}
          label={r.label}
          swatch={
            <span
              className={r.className}
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: "currentColor",
                color: r.color,
              }}
            />
          }
        >
          {r.value === undefined ? "No data" : format(r.value)}
          {r.clamped && <span style={{ opacity: 0.7, fontWeight: 400 }}> (off scale)</span>}
        </ReadoutRow>
      ))}
    </>
  );
}

/**
 * Where a metric's value lands: the one mapping both the marks and the
 * chart's hook use, so an annotation always lines up. `offset` is 0 when
 * metrics sit on their axis (radar) and 0.5 when they fill a slice (pizza).
 */
export function placer(
  metrics: readonly PolarRange[],
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  offset: 0 | 0.5,
) {
  return (
    j: number,
    value: number | null | undefined,
  ): { placed: NormalisedValue; radius: number; point: Point } | undefined => {
    const metric = metrics[j];
    const placed = metric && normaliseMetric(value, metric);
    if (!placed) return undefined;
    const radius = inner + placed.t * (outer - inner);
    return {
      placed,
      radius,
      point: polarPoint(cx, cy, radius, axisAngle(j + offset, metrics.length)),
    };
  };
}

/** What a chart's hook returns: its geometry, and a metric's angle and point. */
export function polarContext(
  metrics: readonly (PolarRange & { id: string })[],
  geometry: { cx: number; cy: number; inner: number; outer: number },
  place: ReturnType<typeof placer>,
  offset: 0 | 0.5,
) {
  const indexOf = new Map(metrics.map((m, j) => [m.id, j]));
  return {
    ...geometry,
    angleOf: (id: string) => axisAngle((indexOf.get(id) ?? 0) + offset, metrics.length),
    pointAt: (id: string, value: number) => {
      const j = indexOf.get(id);
      return j === undefined ? undefined : place(j, value)?.point;
    },
  };
}
