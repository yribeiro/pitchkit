import { useMemo, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  computeChartFrame,
  computeCumulativeSeries,
  createLinearScale,
  niceTicks,
  resolve,
  resolveEndTime,
  stepAreaPath,
  stepPath,
  valueAtTime,
} from "@pitchkit/core";
import type { ChartPadding, Point, RaceEvent } from "@pitchkit/core";
import { RaceChartContext } from "./race-context.js";
import type { ResolvedRaceSeries } from "./race-context.js";
import { RaceGridAndAxes, RaceLegend, RacePeriodBreaks } from "./race-chrome.js";
import type { RaceAppearance, RaceChartProps, RaceHoverRow } from "./race-types.js";
import { useResizeObserver } from "./use-resize-observer.js";

/**
 * Categorical defaults, in fixed slot order so colour follows the entity
 * and never its rank. Slot 1 is the same hex as `--pitch-marker-primary`,
 * so charts and pitches agree out of the box. The set is validated for
 * colourblind separation rather than picked by eye; past six, fold the
 * tail into an "Other" series rather than generating a seventh hue.
 */
const SERIES_COLORS = [
  "var(--pitch-series-1, #3b82f6)",
  "var(--pitch-series-2, #eb6834)",
  "var(--pitch-series-3, #1baf7a)",
  "var(--pitch-series-4, #eda100)",
  "var(--pitch-series-5, #e87ba4)",
  "var(--pitch-series-6, #008300)",
];

/** The ring that keeps a marker legible where it crosses a line. */
const CHART_SURFACE = "var(--pitch-chart-surface, #ffffff)";
const CHART_TEXT = "var(--pitch-chart-text, #12170f)";
const AXIS = "var(--pitch-axis, #c6cebc)";

const DEFAULT_ASPECT_RATIO = 2;
const NOMINAL_WIDTH = 720;

function resolveAppearance(
  appearance: RaceAppearance | undefined,
  seriesCount: number,
): Required<RaceAppearance> {
  return {
    axis: appearance?.axis ?? "both",
    grid: appearance?.grid ?? true,
    // Two overlapping washes muddy exactly where the lines cross, which is
    // the part of a race chart worth reading, so this is opt-in rather
    // than on by default.
    area: appearance?.area ?? false,
    markers: appearance?.markers ?? "emphasis",
    periods: appearance?.periods ?? true,
    endLabels: appearance?.endLabels ?? true,
    legend: appearance?.legend ?? seriesCount > 1,
  };
}

/**
 * Padding is derived from what is actually drawn, so turning the axes off
 * reclaims their gutters instead of leaving the plot floating in space.
 *
 * The end-label gutter is sized to what the label actually occupies — a
 * 12px swatch, a gap, and four digits at 12px — rather than to a round
 * number. The difference is invisible on a wide chart and a tenth of the
 * plot on a phone.
 */
function defaultPadding(appearance: Required<RaceAppearance>): ChartPadding {
  const showX = appearance.axis === "both" || appearance.axis === "x";
  const showY = appearance.axis === "both" || appearance.axis === "y";
  return {
    top: appearance.legend || appearance.periods ? 32 : 10,
    right: appearance.endLabels ? 60 : 10,
    bottom: showX ? 30 : 10,
    left: showY ? 38 : 10,
  };
}

/**
 * Below this width a 2:1 box leaves a plot barely taller than its own
 * axis labels, so the chart gets a squarer one. Phone-width only — it
 * never fires on the sizes a chart is usually read at.
 */
const NARROW_WIDTH = 420;
const NARROW_ASPECT_RATIO = 1.4;

/**
 * The next round tick at or above the highest total.
 *
 * Taking the largest tick that *fits under* the total instead would set
 * the axis ceiling to the total itself, which pins the leading line to the
 * top edge of the plot with no headroom and leaves the top gridline
 * unlabelled. Rounding up gives the chart air and makes every gridline a
 * real tick.
 */
function resolveMaxValue(highestTotal: number): number {
  if (highestTotal <= 0) return 1;
  const ticks = niceTicks(0, highestTotal);
  const step = (ticks[1] ?? 0) - (ticks[0] ?? 0);
  if (step <= 0) return highestTotal;
  return Math.ceil(highestTotal / step) * step;
}

/**
 * A cumulative step chart: one line per series, holding flat between
 * events and jumping at each one. The canonical case is an xG race, where
 * each step is a shot sized by its expected goals.
 *
 * A sibling of `<Pitch>`, not a child of it. There is no pitch and no
 * provider coordinate system here, so it owns its own scales rather than
 * going through `createPixelTransform`
 * (docs/decisions.md D23). It renders SVG only, so it
 * server-renders like every mark layer.
 */
export function RaceChart<T>({
  series,
  time,
  value,
  emphasize,
  period,
  endTime: explicitEndTime,
  maxValue: explicitMaxValue,
  width: explicitWidth,
  height: explicitHeight,
  aspectRatio: explicitAspectRatio,
  padding: explicitPadding,
  appearance,
  tooltip,
  className,
  children,
}: RaceChartProps<T>) {
  const [containerRef, measuredSize] = useResizeObserver<HTMLDivElement>();
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const resolved = resolveAppearance(appearance, series.length);
  const padding = explicitPadding ?? defaultPadding(resolved);

  const isExplicitSize = explicitWidth !== undefined && explicitHeight !== undefined;
  // Measured width drives the ratio, so the box gets taller on a phone.
  // Width never depends on height here (the container is a block filling
  // its parent), so this cannot oscillate with the ResizeObserver.
  const isNarrow = (measuredSize?.width ?? explicitWidth ?? NOMINAL_WIDTH) < NARROW_WIDTH;
  const aspectRatio =
    explicitAspectRatio ?? (isNarrow ? NARROW_ASPECT_RATIO : DEFAULT_ASPECT_RATIO);
  const fallbackSize = {
    width: NOMINAL_WIDTH,
    height: Math.round(NOMINAL_WIDTH / aspectRatio),
  };
  const size = isExplicitSize
    ? { width: explicitWidth, height: explicitHeight }
    : (measuredSize ?? fallbackSize);

  // Accessors are resolved here and core is handed plain numbers, which is
  // what keeps `@pitchkit/core`'s race module free of any dependency on
  // the pitch-shaped `scene/` types.
  const computed = useMemo(() => {
    const accumulated = series.map((s) => {
      const events: RaceEvent[] = s.data.map((d, i) => ({
        time: resolve(time, d, i),
        value: resolve(value, d, i),
        emphasis: emphasize === undefined ? false : resolve(emphasize, d, i),
      }));
      return { series: s, ...computeCumulativeSeries(events) };
    });

    const latest = accumulated.reduce((max, entry) => {
      const last = entry.points[entry.points.length - 1];
      return last === undefined ? max : Math.max(max, last.time);
    }, Number.NEGATIVE_INFINITY);

    const highestTotal = accumulated.reduce((max, entry) => Math.max(max, entry.total), 0);

    // Period breaks are the *last* event minute of each period but the
    // last, which is where the whistle actually went — not a fixed 45.
    const breaks: number[] = [];
    if (period !== undefined) {
      const lastByPeriod = new Map<number, number>();
      series.forEach((s) => {
        s.data.forEach((d, i) => {
          const p = resolve(period, d, i);
          const t = resolve(time, d, i);
          if (!Number.isFinite(p) || !Number.isFinite(t)) return;
          lastByPeriod.set(p, Math.max(lastByPeriod.get(p) ?? t, t));
        });
      });
      const periods = [...lastByPeriod.keys()].sort((a, b) => a - b);
      periods.slice(0, -1).forEach((p) => {
        const end = lastByPeriod.get(p);
        if (end !== undefined) breaks.push(Math.ceil(end));
      });
    }

    return { accumulated, latest, highestTotal, breaks };
  }, [series, time, value, emphasize, period]);

  const endTime = explicitEndTime ?? resolveEndTime(computed.latest);
  const maxValue = explicitMaxValue ?? resolveMaxValue(computed.highestTotal);

  const frame = computeChartFrame(size.width, size.height, padding);
  const scaleX = createLinearScale([0, endTime], [frame.x0, frame.x1]);
  // Range reversed: the SVG y-flip lives in the scale, never in a caller.
  const scaleY = createLinearScale([0, maxValue], [frame.y1, frame.y0]);

  const resolvedSeries: ResolvedRaceSeries[] = computed.accumulated.map((entry, i) => ({
    id: entry.series.id,
    label: entry.series.label ?? entry.series.id,
    // Themed defaults are inline styles and always beat a utility class,
    // so a series given a className surrenders its default — identical to
    // how Scatter treats `fill` (docs/decisions.md D9).
    color:
      entry.series.color ?? (entry.series.className ? undefined : (SERIES_COLORS[i] ?? undefined)),
    className: entry.series.className,
    points: entry.points,
    total: entry.total,
  }));

  const contextValue = {
    frame,
    scaleX,
    scaleY,
    series: resolvedSeries,
    endTime,
    valueAt: (seriesId: string, at: number): number => {
      const found = resolvedSeries.find((s) => s.id === seriesId);
      if (found === undefined) {
        throw new Error(
          `@pitchkit/react: <RaceChart> has no series with id "${seriesId}". ` +
            `Known ids: ${resolvedSeries.map((s) => s.id).join(", ") || "(none)"}.`,
        );
      }
      return valueAtTime(found.points, at);
    },
  };

  const hoverRows: RaceHoverRow[] =
    hoverTime === null
      ? []
      : resolvedSeries.map((s, i) => ({
          id: s.id,
          label: s.label,
          color: s.color ?? SERIES_COLORS[i] ?? CHART_TEXT,
          value: valueAtTime(s.points, hoverTime),
        }));

  function handlePointer(event: ReactPointerEvent<SVGRectElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) return;
    const ratio = (event.clientX - bounds.left) / bounds.width;
    const minute = scaleX.invert(frame.x0 + ratio * frame.plotWidth);
    setHoverTime(Math.min(Math.max(minute, 0), endTime));
  }

  return (
    <div
      ref={isExplicitSize ? undefined : containerRef}
      className={className}
      data-pitchkit-layer="race"
      style={{
        position: "relative",
        width: isExplicitSize ? explicitWidth : "100%",
        height: isExplicitSize ? explicitHeight : undefined,
        aspectRatio: isExplicitSize ? undefined : aspectRatio,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${frame.width} ${frame.height}`}
        style={{ display: "block" }}
      >
        <RaceChartContext.Provider value={contextValue}>
          {resolved.axis !== "none" || resolved.grid ? (
            <RaceGridAndAxes appearance={resolved} />
          ) : null}
          {resolved.periods && computed.breaks.length > 0 && (
            <RacePeriodBreaks breaks={computed.breaks} />
          )}
          {resolved.legend && <RaceLegend colors={SERIES_COLORS} />}

          {resolvedSeries.map((s) => {
            const pixels: Point[] = [
              [scaleX(0), scaleY(0)],
              ...s.points.map((p): Point => [scaleX(p.time), scaleY(p.cumulative)]),
              [scaleX(endTime), scaleY(s.total)],
            ];
            // `color` is undefined exactly when the series carries a
            // className and no explicit colour, which is the D9 contract:
            // the themed default is an inline style and would beat the
            // class at the same property, so it stands down entirely.
            // The className goes on the series group rather than each
            // element, so one `stroke-emerald-400` reaches the line, the
            // area and the markers through SVG's own inheritance instead
            // of needing a class per part.
            const color = s.color;

            return (
              <g key={s.id} data-pitchkit-series={s.id} className={s.className}>
                {resolved.area && (
                  <path
                    d={stepAreaPath(pixels, scaleY(0))}
                    data-pitchkit-part="race-area"
                    style={{ fill: color, fillOpacity: 0.1, stroke: "none" }}
                  />
                )}
                <path
                  d={stepPath(pixels)}
                  data-pitchkit-part="race-line"
                  style={{
                    fill: "none",
                    stroke: color,
                    strokeWidth: 2,
                    strokeLinejoin: "round",
                    strokeLinecap: "round",
                  }}
                />
                {resolved.markers !== "none" &&
                  s.points
                    .filter((p) => resolved.markers === "all" || p.emphasis)
                    .map((p) => (
                      <circle
                        key={p.index}
                        cx={scaleX(p.time)}
                        cy={scaleY(p.cumulative)}
                        r={p.emphasis ? 5 : 3}
                        data-pitchkit-part={p.emphasis ? "race-emphasis" : "race-marker"}
                        style={{
                          fill: color,
                          stroke: CHART_SURFACE,
                          strokeWidth: p.emphasis ? 2 : 1.5,
                        }}
                      />
                    ))}
                {resolved.endLabels && (
                  <g data-pitchkit-part="race-label">
                    <rect
                      x={frame.x1 + 8}
                      y={scaleY(s.total) - 1.25}
                      width={12}
                      height={2.5}
                      rx={1.25}
                      style={{ fill: color }}
                    />
                    <text
                      x={frame.x1 + 26}
                      y={scaleY(s.total) + 4}
                      style={{ fill: CHART_TEXT, fontSize: 12, fontWeight: 500 }}
                    >
                      {s.total.toFixed(2)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {hoverTime !== null && (
            <line
              data-pitchkit-part="race-crosshair"
              x1={scaleX(hoverTime)}
              y1={frame.y0}
              x2={scaleX(hoverTime)}
              y2={frame.y1}
              style={{ stroke: AXIS, strokeWidth: 1, pointerEvents: "none" }}
            />
          )}

          {children}

          {/* Last, so it sits above every mark: one wide hit area beats
              per-point targets on a chart whose whole question is "what
              was the score at minute N". */}
          <rect
            x={frame.x0}
            y={frame.y0}
            width={frame.plotWidth}
            height={frame.plotHeight}
            fill="transparent"
            onPointerMove={handlePointer}
            onPointerLeave={() => setHoverTime(null)}
          />
        </RaceChartContext.Provider>
      </svg>

      {hoverTime !== null && hoverRows.length > 0 && (
        <RaceTooltip
          rows={hoverRows}
          time={hoverTime}
          left={(scaleX(hoverTime) / frame.width) * 100}
          top={(frame.y0 / frame.height) * 100}
          render={tooltip}
        />
      )}
    </div>
  );
}

/**
 * Positioned in percentage terms because the SVG scales to its container
 * while this overlay does not — a pixel offset computed against the
 * viewBox would drift as soon as the two diverge.
 */
function RaceTooltip({
  rows,
  time,
  left,
  top,
  render,
}: {
  rows: readonly RaceHoverRow[];
  time: number;
  left: number;
  top: number;
  render: ((rows: readonly RaceHoverRow[], time: number) => ReactNode) | undefined;
}) {
  return (
    <div
      role="tooltip"
      style={{
        position: "absolute",
        left: `${left}%`,
        // Both offsets are percentages because the SVG scales to its
        // container while this overlay does not — a pixel offset computed
        // against the viewBox drifts as soon as the two diverge. Anchoring
        // to the plot's top keeps it clear of the legend and period labels
        // that live in the padding above it.
        top: `${top}%`,
        transform: left > 60 ? "translateX(-100%)" : "none",
        marginLeft: left > 60 ? -12 : 12,
        pointerEvents: "none",
        background: "var(--pitch-tooltip-bg, rgba(17, 17, 17, 0.92))",
        color: "var(--pitch-tooltip-color, #fff)",
        padding: "6px 10px",
        borderRadius: 4,
        fontSize: 12,
        lineHeight: 1.5,
        whiteSpace: "nowrap",
        zIndex: 10,
      }}
    >
      {render ? (
        render(rows, time)
      ) : (
        <>
          <div style={{ fontWeight: 600 }}>{`${Math.round(time)}'`}</div>
          {rows.map((row) => (
            <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 2.5,
                  borderRadius: 1.25,
                  background: row.color,
                  flexShrink: 0,
                }}
              />
              <span>{row.label}</span>
              <span style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>
                {row.value.toFixed(2)}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
