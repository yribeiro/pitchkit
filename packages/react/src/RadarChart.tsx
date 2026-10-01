import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  LABEL_LINE_HEIGHT,
  axisAngle,
  labelPlacement,
  normaliseMetric,
  polarPoint,
  ringValues,
  wrapLabel,
} from "@pitchkit/core";
import type { NormalisedValue, Point } from "@pitchkit/core";
import { ChartReadout, useDismissOnOutsidePress } from "./chart-readout.js";
import { AXIS, CHART_MUTED, CHART_SURFACE, CHART_TEXT, GRID, seriesColor } from "./chart-tokens.js";
import { warnInDevelopment } from "./dev-warn.js";
import { PolarDetailView, usePolarSelection } from "./polar-detail.js";
import type { PolarMetric, PolarSeries } from "./polar-types.js";
import { RadarChartContext } from "./radar-context.js";
import type { RadarChartContextValue, RadarChartProps } from "./radar-types.js";
import { useChartBox } from "./use-chart-box.js";

const DEFAULT_RINGS = 4;
/** Past three, overlapping shapes stop being tellable apart (dataviz all-pairs cap). */
const READABLE_SERIES = 3;
const WRAP_CHARS = 12;
const TICK_FONT = 8.5;
/** Average glyph width in `em`, for sizing the margin labels need. */
const GLYPH_WIDTH = 0.6;
/** Space between the rim and a label: clear of a dot pinned to the rim. */
const LABEL_GAP = 12;
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

/** A ring between two radii (or a disc, when `r0` is 0), as one path. */
function ringPath(cx: number, cy: number, r0: number, r1: number): string {
  const circle = (r: number) =>
    `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  return r0 > 0 ? `${circle(r1)}${circle(r0)}` : circle(r1);
}

interface Vertex {
  readonly point: Point;
  readonly placed: NormalisedValue | undefined;
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
  const [selection, setSelection] = usePolarSelection(selected, onSelectedChange);
  const labelRefs = useRef(new Map<string, SVGGElement>());
  // useId's colons are legal in an id but not inside url(#…).
  const clipPrefix = `pitchkit-radar-${useId().replace(/:/g, "")}`;
  const lastOpened = useRef<string | null>(null);

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

  // Back from the detail view: focus returns to the label that opened it.
  useEffect(() => {
    if (selection === null && lastOpened.current !== null) {
      labelRefs.current.get(lastOpened.current)?.focus();
      lastOpened.current = null;
    }
  }, [selection]);

  const clearActive = () => setActive(null);
  useDismissOnOutsidePress(containerRef, active !== null, clearActive);

  const count = metrics.length;
  const showLegend = appearance?.legend ?? series.length > 1;
  const showRangeLabels = appearance?.rangeLabels ?? !isNarrow;
  const fontSize = isNarrow ? 10 : 11;
  const ringCount = Math.max(Math.round(rings), 1);
  const text = (value: number, metric: PolarMetric) => (format ?? formatValue)(value, metric);
  const tick = (value: number, metric: PolarMetric) => (format ?? formatTick)(value, metric);

  // Margin is whatever the labels need, so the shape gets the rest.
  const labelLines = metrics.map((m) => {
    const label = `${m.label ?? m.id}${m.lowerIsBetter ? " ↓" : ""}`;
    return labelRotation === "radial" ? [label] : wrapLabel(label, WRAP_CHARS);
  });
  const longest =
    Math.max(0, ...labelLines.flat().map((line) => line.length)) * fontSize * GLYPH_WIDTH;
  const tallest =
    Math.max(1, ...labelLines.map((lines) => lines.length)) * fontSize * LABEL_LINE_HEIGHT;
  const marginX = LABEL_GAP + (labelRotation === "tangent" ? tallest : longest) + 4;
  const marginY = LABEL_GAP + (labelRotation === "radial" ? longest : tallest) + 4;

  const legendTop = showLegend ? LEGEND_HEIGHT : 0;
  const cx = size.width / 2;
  const cy = legendTop + (size.height - legendTop) / 2;
  const outer = Math.max(
    0,
    Math.min(size.width / 2 - marginX, (size.height - legendTop) / 2 - marginY),
  );
  // mplsoccer's proportions: the centre circle is one ring wide.
  const inner = outer / (ringCount + 1);
  const radii = Array.from(
    { length: ringCount + 1 },
    (_, k) => inner + ((outer - inner) * k) / ringCount,
  );
  const angles = metrics.map((_, j) => axisAngle(j, count));
  const radiusOf = (t: number) => inner + t * (outer - inner);

  const resolved = series.map((s, i) => ({
    series: s,
    label: s.label ?? s.id,
    color: s.color ?? (s.className ? undefined : seriesColor(i)),
    vertices: metrics.map((m, j): Vertex => {
      const placed = normaliseMetric(s.values[m.id], m);
      // A missing value pulls the outline to the centre rather than skipping
      // the axis, which would silently change the shape's other angles.
      const point = placed
        ? polarPoint(cx, cy, radiusOf(placed.t), angles[j] as number)
        : ([cx, cy] as const);
      return { point, placed };
    }),
  }));
  const banded = (appearance?.bands ?? true) && resolved.length === 1;
  // Each legend entry starts where the last one's estimated width ends.
  const legendX = resolved.reduce<number[]>(
    (xs, r, i) => [
      ...xs,
      i === 0
        ? 4
        : (xs[i - 1] as number) +
          33 +
          (resolved[i - 1] as typeof r).label.length * (fontSize + 1) * GLYPH_WIDTH,
    ],
    [],
  );

  const indexOf = new Map(metrics.map((m, j) => [m.id, j]));
  const context: RadarChartContextValue = {
    cx,
    cy,
    inner,
    outer,
    angleOf: (id) => angles[indexOf.get(id) ?? 0] ?? 0,
    pointAt: (id, value) => {
      const j = indexOf.get(id);
      const placed =
        j === undefined ? undefined : normaliseMetric(value, metrics[j] as PolarMetric);
      return placed && polarPoint(cx, cy, radiusOf(placed.t), angles[j as number] as number);
    },
  };

  const openMetric =
    selection === null ? undefined : metrics.find((m) => m.id === selection.metricId);
  const close = () => setSelection(null);

  function open(metric: PolarMetric) {
    lastOpened.current = metric.id;
    setActive(null);
    setSelection({ metricId: metric.id });
  }

  function handleLabelKey(event: KeyboardEvent, metric: PolarMetric) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open(metric);
    }
  }

  function handlePointer(event: ReactPointerEvent<SVGCircleElement>) {
    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!bounds || bounds.width === 0 || count === 0) return;
    const x = ((event.clientX - bounds.left) / bounds.width) * size.width - cx;
    const y = ((event.clientY - bounds.top) / bounds.height) * size.height - cy;
    // The nearest axis by angle: the readout follows the pointer round the chart.
    const angle = (Math.atan2(x, -y) + 2 * Math.PI) % (2 * Math.PI);
    const nearest = Math.round((angle / (2 * Math.PI)) * count) % count;
    setActive((prev) => (prev === nearest ? prev : nearest));
  }

  if (renderDetail !== undefined && openMetric !== undefined) {
    const values = Object.fromEntries(
      series.map((s) => {
        const value = s.values[openMetric.id];
        return [s.id, typeof value === "number" && Number.isFinite(value) ? value : undefined];
      }),
    );
    const subtitle = series
      .map((s) => {
        const value = values[s.id];
        return `${s.label ?? s.id} ${value === undefined ? "–" : text(value, openMetric)}`;
      })
      .join(" · ");

    return (
      <div ref={containerRef} className={className} data-pitchkit-layer="radar" style={box.style}>
        <PolarDetailView
          title={openMetric.label ?? openMetric.id}
          subtitle={subtitle}
          onClose={close}
        >
          {renderDetail({ metric: openMetric, series: undefined, values, close })}
        </PolarDetailView>
      </div>
    );
  }

  const activeMetric = active === null ? undefined : metrics[active];
  const activeAnchor =
    active === null ? undefined : polarPoint(cx, cy, outer + LABEL_GAP, angles[active] as number);

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

          {radii.map((r1, k) => (
            <path
              key={k}
              data-pitchkit-part="radar-band"
              d={ringPath(cx, cy, k === 0 ? 0 : (radii[k - 1] as number), r1)}
              fillRule="evenodd"
              style={{ fill: GRID, fillOpacity: k % 2 === ringCount % 2 ? 1 : 0.45 }}
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
                      {radii.map((r1, k) => (
                        <path
                          key={k}
                          data-pitchkit-part="radar-band-tone"
                          d={ringPath(cx, cy, k === 0 ? 0 : (radii[k - 1] as number), r1)}
                          fillRule="evenodd"
                          style={{
                            fill: "currentColor",
                            fillOpacity: k % 2 === ringCount % 2 ? 0.24 : 0.12,
                          }}
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
                {r.vertices.map(
                  (v, j) =>
                    v.placed && (
                      <circle
                        key={j}
                        data-pitchkit-part="radar-dot"
                        data-pitchkit-clamped={v.placed.clamped || undefined}
                        cx={v.point[0]}
                        cy={v.point[1]}
                        r={4}
                        style={{
                          // A value past the axis is pinned to it and drawn hollow,
                          // so the shape never claims more than the range shows.
                          fill: v.placed.clamped ? CHART_SURFACE : "currentColor",
                          stroke: v.placed.clamped ? "currentColor" : CHART_SURFACE,
                          strokeWidth: 2,
                        }}
                      />
                    ),
                )}
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
            const interactive = renderDetail !== undefined;
            const name = metric.label ?? metric.id;
            const w = Math.max(
              MIN_TARGET,
              Math.max(...lines.map((l) => l.length)) * fontSize * GLYPH_WIDTH + 8,
            );
            const h = Math.max(MIN_TARGET, lines.length * fontSize * LABEL_LINE_HEIGHT + 8);
            const top =
              placement.dy * fontSize -
              fontSize -
              (h - lines.length * fontSize * LABEL_LINE_HEIGHT) / 2 +
              2;
            const left =
              placement.anchor === "middle" ? -w / 2 : placement.anchor === "start" ? -4 : 4 - w;
            return (
              <g
                key={metric.id}
                ref={(el) => {
                  if (el) labelRefs.current.set(metric.id, el);
                  else labelRefs.current.delete(metric.id);
                }}
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
                onClick={interactive ? () => open(metric) : undefined}
                onKeyDown={interactive ? (event) => handleLabelKey(event, metric) : undefined}
                onFocus={() => setActive(j)}
                onBlur={clearActive}
                onPointerEnter={() => setActive(j)}
                onPointerLeave={(event) => event.pointerType === "mouse" && clearActive()}
                style={{ cursor: interactive ? "pointer" : undefined, outlineOffset: 2 }}
              >
                <rect x={left} y={top} width={w} height={h} fill="transparent" />
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

      {activeMetric !== undefined && activeAnchor !== undefined && (
        <ChartReadout
          left={(activeAnchor[0] / size.width) * 100}
          top={(Math.min(activeAnchor[1], size.height - 60) / size.height) * 100}
        >
          <RadarReadout
            metric={activeMetric}
            series={resolved}
            index={active as number}
            text={text}
          />
        </ChartReadout>
      )}
    </div>
  );
}

function RadarReadout({
  metric,
  series,
  index,
  text,
}: {
  metric: PolarMetric;
  series: readonly {
    series: PolarSeries;
    label: string;
    color: string | undefined;
    vertices: readonly Vertex[];
  }[];
  index: number;
  text: (value: number, metric: PolarMetric) => string;
}) {
  return (
    <>
      <div style={{ fontWeight: 600 }}>
        {metric.label ?? metric.id}
        {metric.lowerIsBetter && (
          <span style={{ opacity: 0.7, fontWeight: 400 }}> · lower is better</span>
        )}
      </div>
      {series.map((r) => {
        const value = r.series.values[metric.id];
        const placed = r.vertices[index]?.placed;
        return (
          <div key={r.series.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
            <span style={{ opacity: 0.75 }}>{r.label}</span>
            <span
              style={{ marginLeft: "auto", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
            >
              {placed === undefined || typeof value !== "number" ? "No data" : text(value, metric)}
              {placed?.clamped && (
                <span style={{ opacity: 0.7, fontWeight: 400 }}> (off scale)</span>
              )}
            </span>
          </div>
        );
      })}
    </>
  );
}
