import { useCallback, useEffect, useMemo, useState } from "react";
import {
  annularSectorPath,
  axisAngle,
  labelMargin,
  labelPlacement,
  metricLabelLines,
  overlayOrder,
  polarLayout,
  polarPoint,
  ringSteps,
  splitWedge,
  textWidth,
  valueBoxSpot,
  wedgeAngles,
  wedgeLane,
  wedgeMid,
} from "@pitchkit/core";
import type { Point, Wedge } from "@pitchkit/core";
import { DetailView, useDetailSelection } from "./chart-detail.js";
import { ChartReadout, useDismissOnOutsidePress } from "./chart-readout.js";
import { AXIS, CHART_SURFACE, CHART_TEXT, GRID, resolvePaint } from "./chart-tokens.js";
import type { Paint } from "./chart-tokens.js";
import { warnInDevelopment } from "./dev-warn.js";
import { PizzaChartContext } from "./pizza-context.js";
import type {
  PizzaChartContextValue,
  PizzaChartProps,
  PizzaMetric,
  PizzaSeries,
} from "./pizza-types.js";
import {
  ChartLegend,
  LABEL_GAP,
  LEGEND_HEIGHT,
  LabelTspans,
  MetricReadout,
  formatValue,
  placer,
  polarContext,
} from "./polar-parts.js";
import { useChartBox } from "./use-chart-box.js";

/** Rings between the hole and the rim, as in mplsoccer: dashed at each quarter, solid at the rim. */
const RINGS = 4;
const HOLE_RATIO = 0.22;
/** Angular inset at a slice's edges, and between series sharing a slice. */
const SLICE_GAP = 0.012;
const SERIES_GAP = 0.006;
/** Readable limits: past them the slices can't be told apart or read. */
const SIDE_BY_SIDE_LIMIT = 3;
const OVERLAY_LIMIT = 2;
/** The group arc on the rim when slices are coloured by series. */
const RIM_GAP = 3;
const RIM_WIDTH = 4;
/** A value box needs at least this much arc to sit in. */
const MIN_BOX_ARC = 20;
const BOX_HEIGHT = 13;

interface Cell {
  readonly series: PizzaSeries;
  readonly wedge: Wedge;
  /** Radius of the slice's tip, or `undefined` when there is no value. */
  readonly tip: number | undefined;
  readonly value: number | undefined;
  readonly clamped: boolean;
  readonly paint: Paint;
  /** Where the value box is centred, or `undefined` when it has no room. */
  readonly box: Point | undefined;
}

/**
 * A football pizza: one slice per metric, its length the value, coloured
 * by group. With several series each metric's slice is shared, side by side
 * or overlaid.
 *
 * A sibling of `<Pitch>`, not a layer inside one (D23). It draws the values
 * it is given and computes nothing. Pass `renderDetail` and each slice
 * becomes a button that swaps the chart for your component.
 */
export function PizzaChart({
  metrics,
  series,
  seriesLayout = "side-by-side",
  groups,
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
}: PizzaChartProps) {
  const box = useChartBox({ width, height, aspectRatio, wideRatio: 1, narrowRatio: 1 });
  const { containerRef, size, isNarrow } = box;
  const [active, setActive] = useState<number | null>(null);
  /** The slice with keyboard focus, as `metricId/seriesId`. */
  const [focused, setFocused] = useState<string | null>(null);
  const { selection, open, close } = useDetailSelection(containerRef, selected, onSelectedChange);

  const overlay = seriesLayout === "overlay";
  const limit = overlay ? OVERLAY_LIMIT : SIDE_BY_SIDE_LIMIT;
  useEffect(() => {
    if (series.length > limit) {
      warnInDevelopment(
        `<PizzaChart> has ${series.length} series. Past ${limit}, ${
          overlay
            ? "overlaid slices hide each other"
            : "the side-by-side slices are too thin to read"
        }; consider ${overlay ? 'seriesLayout="side-by-side"' : "small multiples"}.`,
      );
    }
    if (metrics.length < 3) {
      warnInDevelopment(`<PizzaChart> needs at least 3 metrics to draw a pizza.`);
    }
  }, [series.length, metrics.length, limit, overlay]);

  const clearActive = useCallback(() => setActive(null), []);
  useDismissOnOutsidePress(containerRef, active !== null, clearActive);

  const count = metrics.length;
  const text = (value: number, metric: PizzaMetric) => (format ?? formatValue)(value, metric);
  const fontSize = isNarrow ? 10 : 11;
  const interactive = renderDetail !== undefined;

  // One series colours its slices by group; several colour by series and show the group on the rim.
  const byGroup = series.length === 1;
  const groupNames = [...new Set(metrics.flatMap((m) => m.group ?? []))];
  // Beside several series, groups take the slots after theirs, so a rim arc never
  // shares a colour with a series.
  const groupSlot = byGroup ? 0 : series.length;
  const groupPaints = new Map(
    groupNames.map((name, i) => [name, resolvePaint(groups?.[name], groupSlot + i)]),
  );
  const hasRim = !byGroup && groupNames.length > 0;

  const showValues = appearance?.values ?? (byGroup || overlay);
  const showLegend = appearance?.legend ?? (byGroup ? groupNames.length > 1 : true);
  const legendEntries = byGroup
    ? groupNames.map((name) => ({ key: name, label: name, ...(groupPaints.get(name) as Paint) }))
    : series.map((s, i) => ({ key: s.id, label: s.label ?? s.id, ...resolvePaint(s, i) }));

  const labelLines = metricLabelLines(metrics, labelRotation);
  const margin = labelMargin(labelLines, labelRotation, fontSize);
  const rim = hasRim ? RIM_GAP + RIM_WIDTH : 0;
  const marginX = LABEL_GAP + rim + margin.x + 4;
  const marginY = LABEL_GAP + rim + margin.y + 4;

  const legendTop = showLegend && legendEntries.length > 0 ? LEGEND_HEIGHT : 0;
  const { cx, cy, outer } = polarLayout(size.width, size.height, legendTop, marginX, marginY);
  const inner = outer * HOLE_RATIO;
  const radii = ringSteps(inner, outer, RINGS);
  const place = useMemo(
    () => placer(metrics, cx, cy, inner, outer, 0.5),
    [metrics, cx, cy, inner, outer],
  );
  const context = useMemo<PizzaChartContextValue>(
    () => polarContext(metrics, { cx, cy, inner, outer }, place, 0.5),
    [metrics, cx, cy, inner, outer, place],
  );
  const labelRadius = outer + LABEL_GAP + rim;

  const rows = metrics.map((metric, j) => {
    const wedge = wedgeAngles(j, count, SLICE_GAP);
    const mid = axisAngle(j + 0.5, count);
    const shares = overlay ? series.map(() => wedge) : splitWedge(wedge, series.length, SERIES_GAP);
    const cells = series.map((s, i): Cell => {
      const at = place(j, s.values[metric.id]);
      const cellWedge = shares[i] as Wedge;
      // Each series' box sits in its own lane across the slice, so close
      // values never print one box over another.
      const spot =
        at &&
        valueBoxSpot(
          cellWedge,
          overlay ? wedgeLane(wedge, i, series.length) : wedgeMid(cellWedge),
          at.radius,
          inner,
          BOX_HEIGHT,
          overlay ? 0 : MIN_BOX_ARC,
        );
      return {
        series: s,
        wedge: cellWedge,
        tip: at?.radius,
        value: at ? (s.values[metric.id] as number) : undefined,
        clamped: at?.placed.clamped ?? false,
        paint:
          byGroup && metric.group !== undefined
            ? (groupPaints.get(metric.group) as Paint)
            : resolvePaint(s, i),
        box: spot && polarPoint(cx, cy, spot.radius, spot.angle),
      };
    });
    const lines = labelLines[j] as string[];
    return {
      metric,
      wedge,
      mid,
      cells,
      lines,
      placement: labelPlacement(mid, labelRotation, lines.length),
      labelAt: polarPoint(cx, cy, labelRadius, mid),
    };
  });

  const openRow =
    selection === null ? undefined : rows.find((r) => r.metric.id === selection.metricId);
  const openCell = openRow?.cells.find((c) => c.series.id === selection?.seriesId);

  function openSlice(metric: PizzaMetric, s: PizzaSeries) {
    setActive(null);
    open({ metricId: metric.id, seriesId: s.id });
  }

  if (renderDetail !== undefined && openRow !== undefined && openCell !== undefined) {
    const chosen = openCell.series;
    const values = Object.fromEntries(series.map((s, i) => [s.id, openRow.cells[i]?.value]));
    return (
      <div ref={containerRef} className={className} data-pitchkit-layer="pizza" style={box.style}>
        <DetailView
          chart="pizza"
          title={openRow.metric.label ?? openRow.metric.id}
          subtitle={`${chosen.label ?? chosen.id} ${
            openCell.value === undefined ? "–" : text(openCell.value, openRow.metric)
          }`}
          onClose={close}
        >
          {renderDetail({ metric: openRow.metric, series: chosen, values, close })}
        </DetailView>
      </div>
    );
  }

  const activeRow = active === null ? undefined : rows[active];
  const activeAnchor = activeRow && polarPoint(cx, cy, labelRadius, activeRow.mid);

  return (
    <div
      ref={containerRef}
      className={className}
      data-pitchkit-layer="pizza"
      style={{ ...box.style, touchAction: "pan-y" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="group"
        aria-label={`Pizza chart: ${series.map((s) => s.label ?? s.id).join(", ")}`}
        style={{ display: "block", overflow: "visible" }}
      >
        <PizzaChartContext.Provider value={context}>
          {showLegend && legendEntries.length > 0 && (
            <ChartLegend part="pizza-legend" fontSize={fontSize} entries={legendEntries} />
          )}

          {radii.slice(1).map((r, k) => (
            <circle
              key={k}
              data-pitchkit-part="pizza-ring"
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              style={{
                stroke: AXIS,
                strokeWidth: k === RINGS - 1 ? 1.25 : 0.8,
                strokeDasharray: k === RINGS - 1 ? undefined : "3 3",
              }}
            />
          ))}

          {rows.map(({ metric, wedge, cells, lines, placement, labelAt }, j) => {
            const order = overlay
              ? overlayOrder(cells.map((c) => c.value))
              : cells.map((_, i) => i);
            return (
              <g
                key={metric.id}
                data-pitchkit-part="pizza-wedge"
                onPointerEnter={() => setActive(j)}
                onPointerDown={() => setActive(j)}
                onPointerLeave={(event) => event.pointerType === "mouse" && clearActive()}
              >
                {overlay && (
                  <path
                    data-pitchkit-part="pizza-blank"
                    d={annularSectorPath(cx, cy, inner, outer, wedge)}
                    style={{ fill: GRID }}
                  />
                )}
                {!overlay &&
                  cells.map((cell) => (
                    <g
                      key={cell.series.id}
                      className={cell.paint.className}
                      style={{ color: cell.paint.color }}
                    >
                      <path
                        data-pitchkit-part="pizza-blank"
                        d={annularSectorPath(cx, cy, inner, outer, cell.wedge)}
                        style={{ fill: "currentColor", fillOpacity: 0.14 }}
                      />
                    </g>
                  ))}
                {order.map((i) => {
                  const cell = cells[i] as Cell;
                  const s = cell.series;
                  if (cell.tip === undefined || cell.value === undefined) return null;
                  const isFocused = focused === `${metric.id}/${s.id}`;
                  const name = interactive
                    ? `${metric.label ?? metric.id}, ${s.label ?? s.id}, ${text(cell.value, metric)}`
                    : undefined;
                  return (
                    <g
                      key={s.id}
                      data-pitchkit-part="pizza-slice"
                      data-pitchkit-metric={metric.id}
                      data-pitchkit-series={s.id}
                      data-pitchkit-clamped={cell.clamped || undefined}
                      className={cell.paint.className}
                      style={{
                        color: cell.paint.color,
                        cursor: interactive ? "pointer" : undefined,
                        // The browser's focus box would wrap the whole bounding box
                        // of a curved slice, so the slice draws its own ring instead.
                        outline: "none",
                      }}
                      role={interactive ? "button" : undefined}
                      tabIndex={interactive ? 0 : undefined}
                      aria-label={name && `${name}. Open details`}
                      onClick={interactive ? () => openSlice(metric, s) : undefined}
                      onKeyDown={
                        interactive
                          ? (event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openSlice(metric, s);
                              }
                            }
                          : undefined
                      }
                      onFocus={() => {
                        setActive(j);
                        setFocused(`${metric.id}/${s.id}`);
                      }}
                      onBlur={() => {
                        clearActive();
                        setFocused(null);
                      }}
                    >
                      <path
                        d={annularSectorPath(cx, cy, inner, cell.tip, cell.wedge)}
                        style={{
                          fill: "currentColor",
                          stroke: isFocused ? CHART_TEXT : CHART_SURFACE,
                          strokeWidth: isFocused ? 2.5 : 1,
                        }}
                      />
                    </g>
                  );
                })}
                {showValues &&
                  order.map((i) => {
                    const cell = cells[i] as Cell;
                    if (cell.box === undefined || cell.value === undefined) return null;
                    const label = text(cell.value, metric);
                    const w = textWidth(label.length, 9) + 8;
                    const [x, y] = cell.box;
                    return (
                      <g
                        key={cell.series.id}
                        data-pitchkit-part="pizza-value"
                        className={cell.paint.className}
                        style={{ color: cell.paint.color, pointerEvents: "none" }}
                      >
                        <rect
                          x={x - w / 2}
                          y={y - BOX_HEIGHT / 2}
                          width={w}
                          height={BOX_HEIGHT}
                          rx={3}
                          style={{ fill: CHART_SURFACE, stroke: "currentColor", strokeWidth: 1.5 }}
                        />
                        <text
                          x={x}
                          y={y}
                          dy="0.35em"
                          textAnchor="middle"
                          style={{
                            fill: CHART_TEXT,
                            fontSize: 9,
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {label}
                        </text>
                      </g>
                    );
                  })}
                {hasRim && metric.group !== undefined && (
                  <g
                    data-pitchkit-part="pizza-rim"
                    className={groupPaints.get(metric.group)?.className}
                    style={{ color: groupPaints.get(metric.group)?.color }}
                  >
                    <path
                      d={annularSectorPath(
                        cx,
                        cy,
                        outer + RIM_GAP,
                        outer + RIM_GAP + RIM_WIDTH,
                        wedge,
                      )}
                      style={{ fill: "currentColor" }}
                    />
                  </g>
                )}
                <text
                  data-pitchkit-part="pizza-label"
                  transform={`translate(${labelAt[0]} ${labelAt[1]}) rotate(${placement.rotate})`}
                  textAnchor={placement.anchor}
                  style={{
                    fill: CHART_TEXT,
                    fontSize,
                    fontWeight: active === j ? 600 : 500,
                    pointerEvents: "none",
                  }}
                >
                  <LabelTspans lines={lines} dy={placement.dy} />
                </text>
              </g>
            );
          })}

          {children}
        </PizzaChartContext.Provider>
      </svg>

      {activeRow !== undefined && activeAnchor !== undefined && (
        <ChartReadout
          left={(activeAnchor[0] / size.width) * 100}
          top={(Math.min(activeAnchor[1], size.height - 60) / size.height) * 100}
        >
          <MetricReadout
            title={activeRow.metric.label ?? activeRow.metric.id}
            lowerIsBetter={activeRow.metric.lowerIsBetter}
            rows={activeRow.cells.map((cell) => ({
              ...cell.paint,
              key: cell.series.id,
              label: cell.series.label ?? cell.series.id,
              value: cell.value,
              clamped: cell.clamped,
            }))}
            format={(value) => text(value, activeRow.metric)}
          />
        </ChartReadout>
      )}
    </div>
  );
}
