import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  LABEL_LINE_HEIGHT,
  axisAngle,
  labelBox,
  labelMargin,
  labelPlacement,
  nearestAxis,
  normaliseMetric,
  polarPoint,
  ringPath,
  ringSteps,
  ringValues,
  wrapLabel,
} from "@pitchkit/core";
import type { NormalisedValue, Point } from "@pitchkit/core";
import {
  ChartReadout,
  ReadoutRow,
  legendOffsets,
  useDismissOnOutsidePress,
} from "./chart-readout.js";
import { AXIS, CHART_MUTED, CHART_TEXT, GRID, seriesColor } from "./chart-tokens.js";
import { warnInDevelopment } from "./dev-warn.js";
import { RadarDetailView, useRadarSelection } from "./radar-detail.js";
import { RadarChartContext } from "./radar-context.js";
import type {
  RadarChartContextValue,
  RadarChartProps,
  RadarMetric,
  RadarSeries,
} from "./radar-types.js";
import { useChartBox } from "./use-chart-box.js";

const DEFAULT_RINGS = 4;
/** Past three, overlapping shapes stop being tellable apart (dataviz all-pairs cap). */
const READABLE_SERIES = 3;
const WRAP_CHARS = 12;
const TICK_FONT = 8.5;
/** Space between the rim and a label. */
const LABEL_GAP = 8;
const LEGEND_HEIGHT = 24;
/** Smallest clickable label, in either direction (WCAG 2.5.8). */
const MIN_TARGET = 24;

/** At most two decimals, with trailing zeros dropped. */
function formatValue(value: number): string {
  return String(Number(value.toFixed(2)));
}

/**
 * Ring values are reference marks, not data: two significant figures (3.1,
 * not 3.125), and whole numbers from ten up.
 */
function formatTick(value: number): string {
  return String(Math.abs(value) >= 10 ? Math.round(value) : Number(value.toPrecision(2)));
}

/** Legend swatch, its gap to the label, and the gap to the next entry. */
const LEGEND_ENTRY_PAD = 33;

interface Vertex {
  readonly point: Point;
  readonly placed: NormalisedValue | undefined;
  /** The series' value, when it is a finite number. */
  readonly value: number | undefined;
}

interface ResolvedSeries {
  readonly series: RadarSeries;
  readonly label: string;
  readonly color: string | undefined;
  readonly vertices: readonly Vertex[];
}

/**
 * Where a metric's value lands: the one mapping both the shapes and
 * `useRadarChart().pointAt` use, so an annotation always lines up.
 */
function placer(
  metrics: readonly RadarMetric[],
  cx: number,
  cy: number,
  inner: number,
  outer: number,
) {
  return (j: number, value: number | null | undefined) => {
    const metric = metrics[j];
    const placed = metric && normaliseMetric(value, metric);
    if (!placed) return undefined;
    const radius = inner + placed.t * (outer - inner);
    return { placed, point: polarPoint(cx, cy, radius, axisAngle(j, metrics.length)) };
  };
}

/**
 * A football radar: one axis per metric, each on its own range, with one
 * translucent shape per series. Lower-is-better axes are flipped, so
 * outward is always better.
 *
 * A sibling of `<Pitch>`, not a layer inside one (D23). It draws the values
 * it is given and computes nothing. Pass `renderDetail` and each axis label
 * becomes a button that swaps the chart for your component.
 */
export function RadarChart({
  metrics,
  series,
  rings = DEFAULT_RINGS,
  labelRotation = "tangent",
  format,
  renderDetail,
  selected,
  onSelectedChange,
  width,
  height,
  aspectRatio,
  appearance,
  className,
  children,
}: RadarChartProps) {
  const box = useChartBox({ width, height, aspectRatio, wideRatio: 1, narrowRatio: 1 });
  const { containerRef, size, isNarrow } = box;
  const [active, setActive] = useState<number | null>(null);
  const { selection, open, close } = useRadarSelection(containerRef, selected, onSelectedChange);
  // useId's colons are legal in an id but not inside url(#…).
  const clipPrefix = `pitchkit-radar-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    if (series.length > READABLE_SERIES) {
      warnInDevelopment(
        `<RadarChart> has ${series.length} series. Past ${READABLE_SERIES}, overlapping shapes ` +
          `can't be told apart; consider small multiples.`,
      );
    }
    if (metrics.length < 3) {
      warnInDevelopment(`<RadarChart> needs at least 3 metrics to draw a shape.`);
    }
  }, [series.length, metrics.length]);

  const clearActive = useCallback(() => setActive(null), []);
  useDismissOnOutsidePress(containerRef, active !== null, clearActive);

  const count = metrics.length;
  const showLegend = appearance?.legend ?? series.length > 1;
  const showRangeLabels = appearance?.rangeLabels ?? !isNarrow;
  const fontSize = isNarrow ? 10 : 11;
  const text = (value: number, metric: RadarMetric) => (format ?? formatValue)(value, metric);
  const tick = (value: number, metric: RadarMetric) => (format ?? formatTick)(value, metric);

  // Margin is whatever the labels need, so the shape gets the rest.
  const labelLines = metrics.map((m) => {
    const label = `${m.label ?? m.id}${m.lowerIsBetter ? " ↓" : ""}`;
    return labelRotation === "radial" ? [label] : wrapLabel(label, WRAP_CHARS);
  });
  const margin = labelMargin(labelLines, labelRotation, fontSize);
  const marginX = LABEL_GAP + margin.x + 4;
  const marginY = LABEL_GAP + margin.y + 4;

  const legendTop = showLegend ? LEGEND_HEIGHT : 0;
  const cx = size.width / 2;
  const cy = legendTop + (size.height - legendTop) / 2;
  const outer = Math.max(
    0,
    Math.min(size.width / 2 - marginX, (size.height - legendTop) / 2 - marginY),
  );
  // mplsoccer's proportions: the centre circle is one ring wide.
  const inner = outer / (Math.max(Math.round(rings), 1) + 1);
  const radii = ringSteps(inner, outer, rings);
  const ringCount = radii.length - 1;
  const bandPaths = radii.map((r1, k) => ({
    d: ringPath(cx, cy, radii[k - 1] ?? 0, r1),
    strong: k % 2 === ringCount % 2,
  }));
  const angles = metrics.map((_, j) => axisAngle(j, count));
  const place = useMemo(
    () => placer(metrics, cx, cy, inner, outer),
    [metrics, cx, cy, inner, outer],
  );

  const resolved: ResolvedSeries[] = series.map((s, i) => ({
    series: s,
    label: s.label ?? s.id,
    color: s.color ?? (s.className ? undefined : seriesColor(i)),
    vertices: metrics.map((m, j): Vertex => {
      const at = place(j, s.values[m.id]);
      // A missing value pulls the outline to the centre rather than skipping
      // the axis, which would silently change the shape's other angles.
      return at
        ? { point: at.point, placed: at.placed, value: s.values[m.id] as number }
        : { point: [cx, cy], placed: undefined, value: undefined };
    }),
  }));
  const banded = (appearance?.bands ?? true) && resolved.length === 1;
  // Each legend entry starts where the last one's estimated width ends.
  const legendX = legendOffsets(
    resolved.map((r) => r.label),
    fontSize + 1,
    LEGEND_ENTRY_PAD,
    4,
  );

  const context = useMemo<RadarChartContextValue>(() => {
    const indexOf = new Map(metrics.map((m, j) => [m.id, j]));
    return {
      cx,
      cy,
      inner,
      outer,
      angleOf: (id) => axisAngle(indexOf.get(id) ?? 0, metrics.length),
      pointAt: (id, value) => {
        const j = indexOf.get(id);
        return j === undefined ? undefined : place(j, value)?.point;
      },
    };
  }, [metrics, cx, cy, inner, outer, place]);

  const openIndex = selection === null ? -1 : metrics.findIndex((m) => m.id === selection.metricId);
  const openMetric = metrics[openIndex];
  const interactive = renderDetail !== undefined;

  function openMetricAt(metric: RadarMetric) {
    setActive(null);
    open({ metricId: metric.id });
  }

  function handleLabelKey(event: KeyboardEvent, metric: RadarMetric) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMetricAt(metric);
    }
  }

  function handlePointer(event: ReactPointerEvent<SVGCircleElement>) {
    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!bounds || bounds.width === 0 || count === 0) return;
    const x = ((event.clientX - bounds.left) / bounds.width) * size.width - cx;
    const y = ((event.clientY - bounds.top) / bounds.height) * size.height - cy;
    // The readout follows the pointer round the chart to the nearest axis.
    setActive(nearestAxis(x, y, count));
  }

  if (renderDetail !== undefined && openMetric !== undefined) {
    const values = Object.fromEntries(
      resolved.map((r) => [r.series.id, r.vertices[openIndex]?.value]),
    );
    const subtitle = resolved
      .map((r) => {
        const value = values[r.series.id];
        return `${r.label} ${value === undefined ? "–" : text(value, openMetric)}`;
      })
      .join(" · ");

    return (
      <div ref={containerRef} className={className} data-pitchkit-layer="radar" style={box.style}>
        <RadarDetailView
          title={openMetric.label ?? openMetric.id}
          subtitle={subtitle}
          onClose={close}
        >
          {renderDetail({ metric: openMetric, values, close })}
        </RadarDetailView>
      </div>
    );
  }

  const activeMetric = active === null ? undefined : metrics[active];
  const activeAnchor = polarPoint(cx, cy, outer + LABEL_GAP, axisAngle(active ?? 0, count));

  return (
    <div
      ref={containerRef}
      className={className}
      data-pitchkit-layer="radar"
      style={{ ...box.style, touchAction: "pan-y" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="group"
        aria-label={`Radar chart: ${resolved.map((r) => r.label).join(", ")}`}
        style={{ display: "block", overflow: "visible" }}
      >
        <RadarChartContext.Provider value={context}>
          {showLegend && (
            <g data-pitchkit-part="radar-legend" style={{ fontSize: fontSize + 1 }}>
              {resolved.map((r, i) => (
                <g
                  key={r.series.id}
                  className={r.series.className}
                  style={{ color: r.color }}
                  transform={`translate(${legendX[i]} 12)`}
                >
                  <rect y={-5} width={10} height={10} rx={2} style={{ fill: "currentColor" }} />
                  <text x={15} dy="0.35em" style={{ fill: CHART_TEXT, fontWeight: 600 }}>
                    {r.label}
                  </text>
                </g>
              ))}
            </g>
          )}

          {bandPaths.map((band, k) => (
            <path
              key={k}
              data-pitchkit-part="radar-band"
              d={band.d}
              fillRule="evenodd"
              style={{ fill: GRID, fillOpacity: band.strong ? 1 : 0.45 }}
            />
          ))}
          {angles.map((angle, j) => {
            const [x0, y0] = polarPoint(cx, cy, inner, angle);
            const [x1, y1] = polarPoint(cx, cy, outer, angle);
            return (
              <line
                key={j}
                data-pitchkit-part="radar-spoke"
                x1={x0}
                y1={y0}
                x2={x1}
                y2={y1}
                style={{
                  stroke: active === j ? CHART_TEXT : AXIS,
                  strokeOpacity: active === j ? 0.6 : 1,
                  strokeWidth: 1,
                }}
              />
            );
          })}

          {resolved.map((r, i) => {
            const points = r.vertices.map((v) => v.point.join(",")).join(" ");
            const clipId = `${clipPrefix}-${i}`;
            return (
              <g
                key={r.series.id}
                data-pitchkit-series={r.series.id}
                className={r.series.className}
                style={{ color: r.color }}
              >
                {banded && (
                  <>
                    <clipPath id={clipId}>
                      <polygon points={points} />
                    </clipPath>
                    <g clipPath={`url(#${clipId})`}>
                      {bandPaths.map((band, k) => (
                        <path
                          key={k}
                          data-pitchkit-part="radar-band-tone"
                          d={band.d}
                          fillRule="evenodd"
                          style={{ fill: "currentColor", fillOpacity: band.strong ? 0.24 : 0.12 }}
                        />
                      ))}
                    </g>
                  </>
                )}
                <polygon
                  data-pitchkit-part="radar-shape"
                  points={points}
                  style={{
                    fill: "currentColor",
                    fillOpacity: banded ? 0 : 0.1,
                    stroke: "currentColor",
                    strokeWidth: 2,
                    strokeLinejoin: "round",
                  }}
                />
              </g>
            );
          })}

          {showRangeLabels &&
            metrics.map((metric, j) => {
              const angle = angles[j] as number;
              const rotate =
                labelRotation === "tangent" ? labelPlacement(angle, "tangent").rotate : 0;
              const values = ringValues(metric, ringCount);
              return (
                <g key={metric.id} data-pitchkit-part="radar-tick">
                  {values.slice(1).map((value, k) => {
                    const [x, y] = polarPoint(cx, cy, radii[k + 1] as number, angle);
                    return (
                      <text
                        key={k}
                        x={x}
                        y={y}
                        dy="0.35em"
                        textAnchor="middle"
                        transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
                        style={{ fill: CHART_MUTED, fontSize: TICK_FONT, pointerEvents: "none" }}
                      >
                        {tick(value, metric)}
                      </text>
                    );
                  })}
                </g>
              );
            })}

          {children}

          {/* The readout's hit area: anywhere on the disc picks the nearest axis. */}
          <circle
            cx={cx}
            cy={cy}
            r={outer}
            fill="transparent"
            onPointerDown={handlePointer}
            onPointerMove={handlePointer}
            onPointerLeave={(event) => event.pointerType === "mouse" && clearActive()}
          />

          {metrics.map((metric, j) => {
            const lines = labelLines[j] as string[];
            const angle = angles[j] as number;
            const placement = labelPlacement(angle, labelRotation, lines.length);
            const [x, y] = polarPoint(cx, cy, outer + LABEL_GAP, angle);
            const name = metric.label ?? metric.id;
            const hit = labelBox(placement, lines, fontSize, MIN_TARGET);
            return (
              <g
                key={metric.id}
                data-pitchkit-part="radar-label"
                data-pitchkit-metric={metric.id}
                transform={`translate(${x} ${y}) rotate(${placement.rotate})`}
                role={interactive ? "button" : undefined}
                tabIndex={interactive ? 0 : undefined}
                aria-label={
                  interactive
                    ? `${name}${metric.lowerIsBetter ? ", lower is better" : ""}. Open details`
                    : undefined
                }
                onClick={interactive ? () => openMetricAt(metric) : undefined}
                onKeyDown={interactive ? (event) => handleLabelKey(event, metric) : undefined}
                onFocus={() => setActive(j)}
                onBlur={clearActive}
                onPointerEnter={() => setActive(j)}
                onPointerLeave={(event) => event.pointerType === "mouse" && clearActive()}
                style={{ cursor: interactive ? "pointer" : undefined, outlineOffset: 2 }}
              >
                <rect
                  x={hit.x}
                  y={hit.y}
                  width={hit.width}
                  height={hit.height}
                  fill="transparent"
                />
                <text
                  textAnchor={placement.anchor}
                  style={{
                    fill: CHART_TEXT,
                    fontSize,
                    fontWeight: active === j ? 600 : 500,
                    textDecoration: interactive ? "underline dotted" : undefined,
                    textUnderlineOffset: 3,
                  }}
                >
                  {lines.map((line, k) => (
                    <tspan key={k} x={0} dy={`${k === 0 ? placement.dy : LABEL_LINE_HEIGHT}em`}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </RadarChartContext.Provider>
      </svg>

      {activeMetric !== undefined && (
        <ChartReadout
          left={(activeAnchor[0] / size.width) * 100}
          top={(Math.min(activeAnchor[1], size.height - 60) / size.height) * 100}
        >
          <RadarReadout
            metric={activeMetric}
            rows={resolved.map((r) => ({ ...r, vertex: r.vertices[active ?? 0] }))}
            text={text}
          />
        </ChartReadout>
      )}
    </div>
  );
}

function RadarReadout({
  metric,
  rows,
  text,
}: {
  metric: RadarMetric;
  rows: readonly (ResolvedSeries & { vertex: Vertex | undefined })[];
  text: (value: number, metric: RadarMetric) => string;
}) {
  return (
    <>
      <div style={{ fontWeight: 600 }}>
        {metric.label ?? metric.id}
        {metric.lowerIsBetter && (
          <span style={{ opacity: 0.7, fontWeight: 400 }}> · lower is better</span>
        )}
      </div>
      {rows.map((r) => (
        <ReadoutRow
          key={r.series.id}
          label={r.label}
          swatch={
            <span
              className={r.series.className}
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
          {r.vertex?.value === undefined ? "No data" : text(r.vertex.value, metric)}
          {r.vertex?.placed?.clamped && (
            <span style={{ opacity: 0.7, fontWeight: 400 }}> (off scale)</span>
          )}
        </ReadoutRow>
      ))}
    </>
  );
}
