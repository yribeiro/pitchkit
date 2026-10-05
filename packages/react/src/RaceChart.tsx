import { useMemo, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  computeChartFrame,
  computeCumulativeSeries,
  createLinearScale,
  layoutMomentumPanels,
  minuteToX,
  niceTicks,
  racePeriodRanges,
  resolve,
  stepAreaPath,
  stepPath,
  valueAtTime,
  xToMinute,
} from "@pitchkit/core";
import type { ChartPadding, MomentumRange, Point, RaceEvent } from "@pitchkit/core";
import { RaceChartContext } from "./race-context.js";
import type { ResolvedRaceSeries } from "./race-context.js";
import { RaceGridAndAxes, RaceLegend, RacePeriodBreaks } from "./race-chrome.js";
import type { RaceAppearance, RaceChartProps, RaceHoverRow } from "./race-types.js";
import { ChartReadout, ReadoutRow, useDismissOnOutsidePress } from "./chart-readout.js";
import { AXIS, CHART_SURFACE, CHART_TEXT, SERIES_COLORS } from "./chart-tokens.js";
import { useChartBox } from "./use-chart-box.js";

const DEFAULT_ASPECT_RATIO = 2;

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
 * There is no gutter for the end labels: they sit above their own line
 * ends, inside the plot, so the lines run the full width of the chart.
 * The only thing reserved on the right is half of the last minute tick,
 * which is centred on the axis end and would otherwise be clipped.
 */
function defaultPadding(appearance: Required<RaceAppearance>): ChartPadding {
  const showX = appearance.axis === "both" || appearance.axis === "x";
  const showY = appearance.axis === "both" || appearance.axis === "y";
  return {
    top: appearance.legend || appearance.periods ? 32 : 10,
    right: showX ? 14 : 10,
    bottom: showX ? 30 : 10,
    left: showY ? 38 : 10,
  };
}

/**
 * On a phone a 2:1 box leaves a plot barely taller than its own axis
 * labels, so the chart gets a squarer one.
 */
const NARROW_ASPECT_RATIO = 1.4;

/**
 * Clearance between a line end and its label. Larger than it looks
 * necessary because the end of a line usually carries a ringed marker.
 */
const END_LABEL_GAP = 12;

/** Text height below its baseline-anchored y, near enough for 12px type. */
const END_LABEL_DESCENT = 8;

/** Average advance of a digit or point at 12px, used to size a label's span. */
const END_LABEL_CHAR_WIDTH = 7;

/**
 * Where an end label sits relative to its line.
 *
 * The leading series labels above its line and every other series below
 * its own, so the labels move apart rather than towards each other and
 * two teams finishing on close totals don't overprint.
 *
 * The leader never flips below. It is the one label with nothing above it
 * to collide with, and a leader that dropped below its line would land on
 * the trailing labels, which is the collision this rule exists to avoid.
 * Room above it is the ceiling's job (`resolveMaxValue`); a pinned
 * `maxValue` that leaves none lets the label run into the top padding.
 *
 * Below has to clear more than the line's end. A cumulative line only
 * ever rises, so the lowest part of it under a right-aligned label is
 * its level at the label's *left* edge, and that earlier step runs
 * straight through a label placed just under the end. `spanLeftY` is
 * that level in pixels. A trailing label that can't fit below, because
 * its line is at the baseline, goes above instead.
 */
function endLabelY(
  lineY: number,
  placeAbove: boolean,
  spanLeftY: number,
  plotBottom: number,
): number {
  const above = lineY - END_LABEL_GAP;
  if (placeAbove) return above;

  const below = Math.max(lineY, spanLeftY) + END_LABEL_GAP + END_LABEL_DESCENT;
  return below <= plotBottom ? below : above;
}

/**
 * The next round tick at or above the highest total, with room above it.
 *
 * Taking the largest tick that *fits under* the total instead would set
 * the axis ceiling to the total itself, which pins the leading line to the
 * top edge of the plot with no headroom and leaves the top gridline
 * unlabelled. Rounding up gives the chart air and makes every gridline a
 * real tick.
 *
 * `headroom` is the fraction of the plot that must stay clear above the
 * highest total, so the leader's end label has somewhere to sit. A bare
 * round-up isn't enough: 2.36 rounds to 2.5, which on a short phone chart
 * is about 10px of air against the 24 a label needs, and the label would
 * land on top of the other team's.
 */
function resolveMaxValue(highestTotal: number, headroom: number): number {
  if (highestTotal <= 0) return 1;
  const target = headroom > 0 && headroom < 1 ? highestTotal / (1 - headroom) : highestTotal;
  const ticks = niceTicks(0, target);
  const step = (ticks[1] ?? 0) - (ticks[0] ?? 0);
  if (step <= 0) return target;
  return Math.ceil(target / step) * step;
}

/**
 * A cumulative step chart: one line per series, holding flat between
 * events and jumping at each one. The canonical case is an xG race, where
 * each step is a shot sized by its expected goals.
 *
 * Periods are drawn one after another, each as wide as its own minutes,
 * because minutes restart at 45 for the second half: a first half with
 * stoppage time and the second half both contain 45'-48'.
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
  emphasise,
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
  const [hover, setHover] = useState<{ period: number; minute: number } | null>(null);

  const resolved = resolveAppearance(appearance, series.length);
  const padding = explicitPadding ?? defaultPadding(resolved);

  const box = useChartBox({
    width: explicitWidth,
    height: explicitHeight,
    aspectRatio: explicitAspectRatio,
    wideRatio: DEFAULT_ASPECT_RATIO,
    narrowRatio: NARROW_ASPECT_RATIO,
  });
  const { containerRef, size } = box;

  // Accessors are resolved here and core is handed plain numbers, which is
  // what keeps `@pitchkit/core`'s race module free of any dependency on
  // the pitch-shaped `scene/` types.
  const computed = useMemo(() => {
    const resolved = series.map((s) =>
      s.data.map((d, i): RaceEvent => ({
        period: resolve(period, d, i),
        time: resolve(time, d, i),
        value: resolve(value, d, i),
        emphasis: emphasise === undefined ? false : resolve(emphasise, d, i),
      })),
    );

    // Each period runs to its own last event, floored at its nominal end,
    // so stoppage time widens its own half. An explicit `endTime` sets the
    // last period's end.
    const ranges = racePeriodRanges(
      resolved.flat().filter((event) => Number.isFinite(event.value)),
      explicitEndTime,
    );

    // The chart ends where the last period does, and so does the running
    // total: anything after an explicit `endTime` is dropped rather than
    // drawn off the plot.
    const last = ranges[ranges.length - 1] as MomentumRange;
    const until = { period: ranges.length, time: last.end };
    const accumulated = series.map((s, i) => ({
      series: s,
      ...computeCumulativeSeries(resolved[i] as RaceEvent[], until),
    }));

    const highestTotal = accumulated.reduce((max, entry) => Math.max(max, entry.total), 0);

    return { accumulated, highestTotal, ranges };
  }, [series, time, value, emphasise, period, explicitEndTime]);

  const frame = computeChartFrame(size.width, size.height, padding);
  // Contiguous: the line runs straight from one period into the next.
  const panels = layoutMomentumPanels(computed.ranges, frame.x0, frame.x1, 0);
  const endTime = computed.ranges[computed.ranges.length - 1]?.end ?? 90;
  // Unclamped, so a point past an explicit `endTime` is drawn where it is.
  const scaleX = (minute: number, at: number) =>
    panels[at - 1]?.scale(minute) ?? minuteToX(panels, minute, at);
  const pointerAt = (x: number) =>
    xToMinute(panels, Math.min(Math.max(x, frame.x0), frame.x1)) ?? { period: 1, minute: 0 };
  // Clear the plot's top by enough for the leader's end label to sit above
  // its line. A caller who pins `maxValue` has asked for that exact axis,
  // so they get it and the label simply runs into the top padding.
  const labelHeadroom =
    resolved.endLabels && frame.plotHeight > 0 ? (END_LABEL_GAP * 2) / frame.plotHeight : 0;
  const maxValue = explicitMaxValue ?? resolveMaxValue(computed.highestTotal, labelHeadroom);
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

  // Computed once and consumed by both render passes below, so the line
  // and the markers can never be drawn from different numbers.
  const renderedSeries = resolvedSeries.map((s) => ({
    ...s,
    pixels: [
      [frame.x0, scaleY(0)],
      ...s.points.map((p): Point => [scaleX(p.time, p.period), scaleY(p.cumulative)]),
      [frame.x1, scaleY(s.total)],
    ] as Point[],
  }));

  // The series whose end label goes above its line. Ties go to the first
  // series, so which label flips never depends on float noise.
  const leaderIndex = renderedSeries.reduce(
    (best, s, i, all) => (s.total > (all[best]?.total ?? -Infinity) ? i : best),
    0,
  );

  const contextValue = {
    frame,
    panels,
    scaleX,
    scaleY,
    series: resolvedSeries,
    endTime,
    valueAt: (seriesId: string, at: number, inPeriod: number): number => {
      const found = resolvedSeries.find((s) => s.id === seriesId);
      if (found === undefined) {
        throw new Error(
          `@pitchkit/react: <RaceChart> has no series with id "${seriesId}". ` +
            `Known ids: ${resolvedSeries.map((s) => s.id).join(", ") || "(none)"}.`,
        );
      }
      return valueAtTime(found.points, at, inPeriod);
    },
  };

  const hoverRows: RaceHoverRow[] =
    hover === null
      ? []
      : resolvedSeries.map((s, i) => ({
          id: s.id,
          label: s.label,
          color: s.color ?? SERIES_COLORS[i] ?? CHART_TEXT,
          value: valueAtTime(s.points, hover.minute, hover.period),
        }));

  /**
   * On touch, `pointerleave` fires the instant the finger lifts — the
   * pointer stops existing — so clearing on it would set the crosshair and
   * wipe it in the same gesture. A touch readout therefore persists until
   * the next tap or until a scroll cancels the gesture, which is how a
   * phone chart is read. A mouse leaving the plot still clears.
   */
  useDismissOnOutsidePress(containerRef, hover !== null, () => setHover(null));

  function handlePointerLeave(event: ReactPointerEvent<SVGRectElement>) {
    if (event.pointerType === "mouse") setHover(null);
  }

  function handlePointer(event: ReactPointerEvent<SVGRectElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) return;
    const ratio = (event.clientX - bounds.left) / bounds.width;
    setHover(pointerAt(frame.x0 + ratio * frame.plotWidth));
  }

  const hoverX = hover === null ? undefined : scaleX(hover.minute, hover.period);

  return (
    <div
      ref={containerRef}
      className={className}
      data-pitchkit-layer="race"
      style={{
        ...box.style,
        // A horizontal drag scrubs the crosshair; a vertical one still
        // scrolls the page. Without this the browser claims both axes and
        // the chart is unreadable on a phone, where the crosshair is the
        // only way to get a value between two labelled points.
        touchAction: "pan-y",
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
          {resolved.periods && panels.length > 1 && <RacePeriodBreaks />}
          {resolved.legend && <RaceLegend colors={SERIES_COLORS} />}

          {/*
            Drawn in two passes, because a chart with two series would
            otherwise let the second team's line run straight over the
            first team's goal markers. Lines and fills first, then every
            marker and label on top of all of them, then the annotation
            slot above everything. A mark that says "a goal happened here"
            is never something a line should cover.
          */}
          {series.map((s, i) => {
            const rendered = renderedSeries[i];
            if (rendered === undefined) return null;
            return (
              <g key={`line-${s.id}`} data-pitchkit-series={s.id} className={rendered.className}>
                {resolved.area && (
                  <path
                    d={stepAreaPath(rendered.pixels, scaleY(0))}
                    data-pitchkit-part="race-area"
                    style={{ fill: rendered.color, fillOpacity: 0.1, stroke: "none" }}
                  />
                )}
                <path
                  d={stepPath(rendered.pixels)}
                  data-pitchkit-part="race-line"
                  style={{
                    fill: "none",
                    stroke: rendered.color,
                    strokeWidth: 2,
                    strokeLinejoin: "round",
                    strokeLinecap: "round",
                  }}
                />
              </g>
            );
          })}

          {series.map((s, i) => {
            const rendered = renderedSeries[i];
            if (rendered === undefined) return null;
            return (
              <g key={`marks-${s.id}`} data-pitchkit-series={s.id} className={rendered.className}>
                {resolved.markers !== "none" &&
                  rendered.points
                    .filter((p) => resolved.markers === "all" || p.emphasis)
                    .map((p) => (
                      <circle
                        key={p.index}
                        cx={scaleX(p.time, p.period)}
                        cy={scaleY(p.cumulative)}
                        r={p.emphasis ? 5 : 4}
                        data-pitchkit-part={p.emphasis ? "race-emphasis" : "race-marker"}
                        style={{
                          fill: rendered.color,
                          stroke: CHART_SURFACE,
                          strokeWidth: p.emphasis ? 2 : 1.5,
                        }}
                      />
                    ))}
                {resolved.endLabels &&
                  (() => {
                    const text = rendered.total.toFixed(2);
                    // The label's left edge, where the line is at its
                    // lowest under it. Only the value is printed: the
                    // legend already names the series, and a name beside
                    // a number doubled the label's width for no gain.
                    const left = pointerAt(frame.x1 - text.length * END_LABEL_CHAR_WIDTH);
                    return (
                      <text
                        data-pitchkit-part="race-end-label"
                        x={frame.x1}
                        y={endLabelY(
                          scaleY(rendered.total),
                          i === leaderIndex,
                          scaleY(valueAtTime(rendered.points, left.minute, left.period)),
                          frame.y1,
                        )}
                        textAnchor="end"
                        style={{
                          fill: CHART_TEXT,
                          fontSize: 12,
                          fontWeight: 600,
                          // A halo in the surface colour, painted under the
                          // glyphs: the text equivalent of the ring round a
                          // marker. Where a label does cross a line or a
                          // gridline it stays legible without a box.
                          stroke: CHART_SURFACE,
                          strokeWidth: 4,
                          strokeLinejoin: "round",
                          paintOrder: "stroke",
                        }}
                      >
                        {text}
                      </text>
                    );
                  })()}
              </g>
            );
          })}

          {hoverX !== undefined && (
            <line
              data-pitchkit-part="race-crosshair"
              x1={hoverX}
              y1={frame.y0}
              x2={hoverX}
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
            onPointerDown={handlePointer}
            onPointerMove={handlePointer}
            onPointerLeave={handlePointerLeave}
            onPointerCancel={() => setHover(null)}
          />
        </RaceChartContext.Provider>
      </svg>

      {hover !== null && hoverX !== undefined && hoverRows.length > 0 && (
        <RaceTooltip
          rows={hoverRows}
          time={hover.minute}
          period={hover.period}
          left={(hoverX / frame.width) * 100}
          top={(frame.y0 / frame.height) * 100}
          render={tooltip}
        />
      )}
    </div>
  );
}

function RaceTooltip({
  rows,
  time,
  period,
  left,
  top,
  render,
}: {
  rows: readonly RaceHoverRow[];
  time: number;
  period: number;
  left: number;
  top: number;
  render: ((rows: readonly RaceHoverRow[], time: number, period: number) => ReactNode) | undefined;
}) {
  return (
    <ChartReadout left={left} top={top}>
      {render ? (
        render(rows, time, period)
      ) : (
        <>
          {/* Floored, not rounded: the total is step-after, so at 44.6' a
              45' shot hasn't counted yet and the label mustn't say 45'. */}
          <div style={{ fontWeight: 600 }}>{`${Math.floor(time)}'`}</div>
          {rows.map((row) => (
            <ReadoutRow
              key={row.id}
              label={row.label}
              swatch={
                <span
                  style={{
                    width: 10,
                    height: 2.5,
                    borderRadius: 1.25,
                    background: row.color,
                    flexShrink: 0,
                  }}
                />
              }
            >
              {row.value.toFixed(2)}
            </ReadoutRow>
          ))}
        </>
      )}
    </ChartReadout>
  );
}
