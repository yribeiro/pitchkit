import { useCallback, useEffect, useMemo, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  stackOffsets,
  barAtMinute,
  computeChartFrame,
  computeMomentumBars,
  clipMomentumBars,
  minuteToX,
  xToMinute,
  unevenBarWidths,
  createLinearScale,
  groupByPeriod,
  isPeriod,
  layoutMomentumPanels,
  matchMinuteTicks,
  momentumExtent,
  resolve,
  resolvePeriodRange,
} from "@pitchkit/core";
import type { ChartPadding, MomentumBar, MomentumRange } from "@pitchkit/core";
import { ChartReadout, useDismissOnOutsidePress } from "./chart-readout.js";
import { MomentumChartContext } from "./momentum-context.js";
import {
  MomentumGlyph,
  MomentumIcon,
  SIDE_COLOR,
  colorSaysTeam,
  iconColor,
  kindLabel,
} from "./momentum-icons.js";
import type {
  MomentumAppearance,
  MomentumChartContextValue,
  MomentumChartProps,
  MomentumEventKind,
  MomentumHover,
  MomentumSide,
  MomentumTeams,
} from "./momentum-types.js";
import { AXIS, CHART_MUTED, CHART_SURFACE, CHART_TEXT, GRID } from "./chart-tokens.js";
import { useChartBox } from "./use-chart-box.js";
import { warnInDevelopment } from "./dev-warn.js";

const DEFAULT_ASPECT_RATIO = 3;
/**
 * Below this width a 3:1 box leaves a plot too short to read a bar's height
 * in, so the chart gets a taller one. Phone-width only.
 */
const NARROW_ASPECT_RATIO = 1.8;

/** The gap between periods, in pixels. */
const PERIOD_GAP = 8;
/** Icons shrink on a phone, where a 16px one is a twentieth of the chart. */
const ICON_SIZE = 13;
const NARROW_ICON_SIZE = 11;
/** Height of the minute-label row under the plot. */
const AXIS_HEIGHT = 18;

/** Whole numbers as they are, everything else to one decimal place. */
function formatValue(value: number): string {
  const magnitude = Math.abs(value);
  if (Number.isInteger(magnitude)) return String(magnitude);
  return magnitude >= 10 ? String(Math.round(magnitude)) : magnitude.toFixed(1);
}

function resolveAppearance(
  appearance: MomentumAppearance | undefined,
  hasTeams: boolean,
): Required<MomentumAppearance> {
  return {
    axis: appearance?.axis ?? true,
    legend: (appearance?.legend ?? true) && hasTeams,
  };
}

/**
 * Match momentum: who had the pressure, minute by minute, as bars above and
 * below a zero line. The home side's bars grow up, the away side's down, and
 * each period is its own panel.
 *
 * A sibling of `<Pitch>` and `<RaceChart>`, not a layer inside one: there is
 * no pitch and no provider coordinate system, so it owns its own scales
 * (docs/decisions.md D23). It renders SVG only, so it server-renders like every
 * mark layer.
 */
export function MomentumChart<T, E = never>(props: MomentumChartProps<T, E>) {
  const {
    data,
    time,
    period,
    value,
    periodRanges,
    maxValue: explicitMaxValue,
    teams,
    width: explicitWidth,
    height: explicitHeight,
    aspectRatio: explicitAspectRatio,
    padding: explicitPadding,
    appearance,
    tooltip,
    className,
    children,
  } = props;

  const [hover, setHover] = useState<{ panel: number; minute: number } | null>(null);

  const resolved = resolveAppearance(appearance, teams !== undefined);

  const box = useChartBox({
    width: explicitWidth,
    height: explicitHeight,
    aspectRatio: explicitAspectRatio,
    wideRatio: DEFAULT_ASPECT_RATIO,
    narrowRatio: NARROW_ASPECT_RATIO,
  });
  const { containerRef, size, isNarrow } = box;

  // Accessors are resolved here and core is handed plain numbers. The flat
  // list is grouped by period, then each period's bars are built once,
  // unclipped, to find where its data really ends, and clipped to the range
  // that produces. A bar's index is mapped back to its place in `data`.
  const computed = useMemo(() => {
    const overridden = Object.keys(periodRanges ?? {}).map(Number);
    const groups = groupByPeriod(
      data.map((datum, i) => resolve(period, datum, i)),
      Math.max(2, ...overridden.filter(isPeriod)),
    );
    const unclippedBars = groups.map((indices) =>
      computeMomentumBars(
        indices.map((i) => ({
          time: resolve(time, data[i] as T, i),
          value: resolve(value, data[i] as T, i),
        })),
      ).map((bar) => ({ ...bar, index: indices[bar.index] as number })),
    );
    const ranges: MomentumRange[] = unclippedBars.map((unclipped, index) => {
      const latestEnd =
        unclipped.length > 0 ? (unclipped[unclipped.length - 1] as MomentumBar).end : undefined;
      const natural = resolvePeriodRange(index, latestEnd);
      const override = periodRanges?.[index + 1];
      return { start: override?.start ?? natural.start, end: override?.end ?? natural.end };
    });
    const bars = unclippedBars.map((unclipped, index) =>
      clipMomentumBars(unclipped, ranges[index] as MomentumRange),
    );
    const values = bars.flatMap((periodBars) => periodBars.map((bar) => bar.value));
    return { ranges, bars, values };
  }, [data, time, period, value, periodRanges]);

  // Halves sampled at different intervals draw bars of different widths side
  // by side, which reads as a bug in the chart. It is allowed — the data can
  // be at any interval — but it is nearly always a data-prep slip, so say so
  // in development.
  useEffect(() => {
    const widths = unevenBarWidths(computed.bars);
    if (widths !== undefined) {
      warnInDevelopment(
        `<MomentumChart> periods are sampled at different intervals ` +
          `(median bar widths ${widths.map((w) => `${+w.toFixed(2)}'`).join(", ")}), so the ` +
          `halves draw bars of different widths. Resample them to one interval unless that is intended.`,
      );
    }
  }, [computed.bars]);

  const extent = explicitMaxValue ?? momentumExtent(computed.values);

  // Horizontal layout depends only on the width and side padding.
  const sidePadding = explicitPadding ?? { top: 0, right: 10, bottom: 0, left: 10 };
  const panels = layoutMomentumPanels(
    computed.ranges,
    sidePadding.left,
    size.width - sidePadding.right,
    PERIOD_GAP,
  );

  // Narrowed once, out here: inside the closure below TypeScript forgets that
  // `events` being present means its accessors are too.
  const eventProps = props.events === undefined ? undefined : props;
  const placedEvents =
    eventProps === undefined
      ? []
      : eventProps.events
          .map((datum, i) => ({
            datum,
            minute: resolve(eventProps.eventTime, datum, i),
            period: resolve(eventProps.eventPeriod, datum, i),
            side: resolve(eventProps.eventSide, datum, i),
            kind: resolve(eventProps.eventKind, datum, i),
            label:
              eventProps.eventLabel === undefined
                ? undefined
                : resolve(eventProps.eventLabel, datum, i),
          }))
          // An event in a period the chart doesn't draw (a shootout, say)
          // has nowhere true to go, and one without a minute has no place
          // in its period: both are dropped, as the bars drop such samples.
          .filter(
            (event) =>
              Number.isFinite(event.minute) &&
              isPeriod(event.period) &&
              event.period <= computed.ranges.length,
          );

  const iconSize = isNarrow ? NARROW_ICON_SIZE : ICON_SIZE;
  // The event strip is one row: the icon, and room for a team underline.
  const stripHeight = iconSize + 6;

  // Icons that would touch fan out into a shallow stack, each a little right
  // of the last and painted over it, so the row never grows taller.
  const trueXs = placedEvents.map((event) => minuteToX(panels, event.minute, event.period));
  const eventXs = stackOffsets(trueXs, iconSize, iconSize * 0.55);
  const paintOrder = eventXs
    .map((_, i) => i)
    .sort((a, b) => (eventXs[a] as number) - (eventXs[b] as number));

  const padding: ChartPadding = explicitPadding ?? {
    top: resolved.legend ? 30 : 10,
    right: 10,
    left: 10,
    bottom: (resolved.axis ? AXIS_HEIGHT : 4) + (placedEvents.length > 0 ? stripHeight + 2 : 0),
  };

  const frame = computeChartFrame(size.width, size.height, padding);
  // Range reversed: the SVG y-flip lives in the scale, never in a caller.
  const scaleY = createLinearScale([-extent, extent], [frame.y1, frame.y0]);
  const zeroY = scaleY(0);

  const contextValue: MomentumChartContextValue = {
    frame,
    panels,
    scaleY,
    scaleX: (minute, period) => minuteToX(panels, minute, period),
    bars: computed.bars,
  };

  let hoverInfo: MomentumHover<T, E> | null = null;
  let hoveredEvents: typeof placedEvents = [];
  if (hover !== null) {
    const bar = barAtMinute(computed.bars[hover.panel] ?? [], hover.minute);
    // With no bar under the pointer, events within half a minute still count.
    const window = bar ?? { start: hover.minute - 0.5, end: hover.minute + 0.5 };
    hoveredEvents = placedEvents.filter(
      (event) =>
        event.period === hover.panel + 1 &&
        event.minute >= window.start &&
        event.minute < window.end,
    );
    hoverInfo = {
      minute: hover.minute,
      period: hover.panel + 1,
      bar,
      datum: bar === undefined ? undefined : data[bar.index],
      events: hoveredEvents.map((event) => event.datum),
    };
  }

  const clearHover = useCallback(() => setHover(null), []);
  useDismissOnOutsidePress(containerRef, hover !== null, clearHover);

  /**
   * On touch, `pointerleave` fires the instant the finger lifts, so clearing
   * on it would set the readout and wipe it in the same gesture. A touch
   * readout persists until a press outside the chart; a mouse leaving the
   * plot still clears.
   */
  function handlePointerLeave(event: ReactPointerEvent<SVGRectElement>) {
    if (event.pointerType === "mouse") setHover(null);
  }

  function handlePointer(event: ReactPointerEvent<SVGRectElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) return;
    const x = frame.x0 + ((event.clientX - bounds.left) / bounds.width) * frame.plotWidth;
    const at = xToMinute(panels, x);
    // The gap between periods is not a minute of the match.
    if (at === undefined) return setHover(null);
    const { minute } = at;
    const panel = at.period - 1;
    // Same spot as before: keep the state so React skips the re-render.
    setHover((prev) =>
      prev?.panel === panel && prev.minute === minute ? prev : { panel, minute },
    );
  }

  const hoverX = hover === null ? undefined : panels[hover.panel]?.scale(hover.minute);
  const eventsTop = frame.y1 + (resolved.axis ? AXIS_HEIGHT : 4);

  return (
    <div
      ref={containerRef}
      className={className}
      data-pitchkit-layer="momentum"
      style={{
        ...box.style,
        // A horizontal drag scrubs the readout; a vertical one still scrolls
        // the page. Without this the browser claims both axes.
        touchAction: "pan-y",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${frame.width} ${frame.height}`}
        style={{ display: "block" }}
      >
        <MomentumChartContext.Provider value={contextValue}>
          {resolved.legend && teams !== undefined && (
            <Legend teams={teams} x={frame.x0} y={frame.y0 - 14} />
          )}

          {panels.map((panel) => (
            <g key={panel.index} data-pitchkit-part="momentum-panel">
              <rect
                x={panel.x0}
                y={frame.y0}
                width={Math.max(panel.x1 - panel.x0, 0)}
                height={frame.plotHeight}
                rx={3}
                style={{ fill: GRID, fillOpacity: 0.45 }}
              />
              {(computed.bars[panel.index] ?? []).map((bar) => {
                const x0 = panel.scale(bar.start);
                const x1 = panel.scale(bar.end);
                // A hairline of surface between neighbours, so two bars of the
                // same colour stay two bars. Thinner bars get less of it.
                const inset = Math.min(1, (x1 - x0) * 0.25);
                const y = scaleY(bar.value);
                // A bar that is nonzero is never thinner than a pixel, so a
                // small value doesn't vanish into the zero line.
                const height = Math.max(Math.abs(y - zeroY), bar.value === 0 ? 0 : 1);
                const side: MomentumSide = bar.value >= 0 ? "home" : "away";
                return (
                  <rect
                    key={bar.index}
                    data-pitchkit-part="momentum-bar"
                    data-pitchkit-side={side}
                    x={x0 + inset / 2}
                    y={bar.value >= 0 ? zeroY - height : zeroY}
                    width={Math.max(x1 - x0 - inset, 0)}
                    height={height}
                    rx={Math.min(1.5, (x1 - x0) / 2)}
                    style={{ fill: SIDE_COLOR[side] }}
                  />
                );
              })}
              <line
                data-pitchkit-part="momentum-zero"
                x1={panel.x0}
                y1={zeroY}
                x2={panel.x1}
                y2={zeroY}
                style={{ stroke: AXIS, strokeWidth: 1 }}
              />
              {resolved.axis &&
                matchMinuteTicks(panel.end)
                  .filter(
                    (m) =>
                      m >= panel.start && m <= panel.end && (panel.index === 0 || m > panel.start),
                  )
                  .map((minute) => (
                    <text
                      key={minute}
                      data-pitchkit-part="momentum-label"
                      x={panel.scale(minute)}
                      y={frame.y1 + 13}
                      textAnchor="middle"
                      style={{ fill: CHART_MUTED, fontSize: 10 }}
                    >
                      {`${minute}'`}
                    </text>
                  ))}
            </g>
          ))}

          {paintOrder.map((i) => {
            const event = placedEvents[i] as (typeof placedEvents)[number];
            const x = eventXs[i] as number;
            const y = eventsTop + iconSize / 2 + 1;
            const name = event.label ?? kindLabel(event.kind);
            return (
              <g
                key={i}
                data-pitchkit-part="momentum-event"
                data-pitchkit-kind={event.kind}
                data-pitchkit-side={event.side}
              >
                <title>{`${name}, ${Math.floor(event.minute)}'`}</title>
                {/* A surface backing, so an icon stacked over another reads as
                    sitting on top of it rather than tangled with it. */}
                <circle cx={x} cy={y} r={iconSize / 2 + 1} style={{ fill: CHART_SURFACE }} />
                <MomentumIcon
                  kind={event.kind}
                  x={x}
                  y={y}
                  size={iconSize}
                  color={iconColor(event.kind, event.side)}
                />
                {/* The team, for the icons whose own colour can't say it: a
                    card is yellow or red whoever was booked. */}
                {!colorSaysTeam(event.kind) && (
                  <rect
                    x={x - iconSize * 0.3}
                    y={y + iconSize / 2 + 1}
                    width={iconSize * 0.6}
                    height={2}
                    rx={1}
                    style={{ fill: SIDE_COLOR[event.side] }}
                  />
                )}
              </g>
            );
          })}

          {children}

          {hoverX !== undefined && (
            <line
              data-pitchkit-part="momentum-crosshair"
              x1={hoverX}
              y1={frame.y0}
              x2={hoverX}
              y2={frame.y1}
              style={{ stroke: CHART_MUTED, strokeWidth: 1, pointerEvents: "none" }}
            />
          )}

          {/* Last, so it sits above every mark: one wide hit area beats
              per-bar targets on bars a few pixels wide. */}
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
        </MomentumChartContext.Provider>
      </svg>

      {hoverInfo !== null && hoverX !== undefined && (
        <ChartReadout left={(hoverX / frame.width) * 100} top={(frame.y0 / frame.height) * 100}>
          {tooltip !== undefined ? (
            tooltip(hoverInfo)
          ) : (
            <DefaultReadout hover={hoverInfo} teams={teams} events={hoveredEvents} />
          )}
        </ChartReadout>
      )}
    </div>
  );
}

/** Which colour and direction is which team. Triangles, because direction is the point. */
function Legend({ teams, x, y }: { teams: MomentumTeams; x: number; y: number }) {
  const awayX = x + 22 + teams.home.length * 6.5 + 18;
  return (
    <g data-pitchkit-part="momentum-legend">
      <path d={`M${x} ${y + 1}l4.5-8 4.5 8Z`} style={{ fill: SIDE_COLOR.home }} />
      <text x={x + 14} y={y} style={{ fill: CHART_TEXT, fontSize: 11, fontWeight: 600 }}>
        {teams.home}
      </text>
      <path d={`M${awayX} ${y - 7}l4.5 8 4.5-8Z`} style={{ fill: SIDE_COLOR.away }} />
      <text x={awayX + 14} y={y} style={{ fill: CHART_TEXT, fontSize: 11, fontWeight: 600 }}>
        {teams.away}
      </text>
    </g>
  );
}

function DefaultReadout<T, E>({
  hover,
  teams,
  events,
}: {
  hover: MomentumHover<T, E>;
  teams: MomentumTeams | undefined;
  /** The events at the hovered minute, with their resolved side, kind and label. */
  events: readonly {
    datum: E;
    side: MomentumSide;
    kind: MomentumEventKind;
    label: string | undefined;
  }[];
}): ReactNode {
  const side: MomentumSide | null =
    hover.bar === undefined || hover.bar.value === 0 ? null : hover.bar.value > 0 ? "home" : "away";
  const teamName = (s: MomentumSide) => teams?.[s] ?? (s === "home" ? "Home" : "Away");

  return (
    <>
      <div style={{ fontWeight: 600 }}>{`${Math.floor(hover.minute)}'`}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {side !== null && (
          <span
            style={{
              width: 0,
              height: 0,
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              [side === "home" ? "borderBottom" : "borderTop"]: `7px solid ${SIDE_COLOR[side]}`,
            }}
          />
        )}
        <span style={{ opacity: 0.75 }}>
          {hover.bar === undefined ? "No data" : side === null ? "Level" : teamName(side)}
        </span>
        {hover.bar !== undefined && side !== null && (
          <span style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
            {formatValue(hover.bar.value)}
          </span>
        )}
      </div>
      {events.map((event, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MomentumGlyph kind={event.kind} color={iconColor(event.kind, event.side)} />
          <span>{event.label ?? kindLabel(event.kind)}</span>
          <span style={{ opacity: 0.75, marginLeft: "auto" }}>{teamName(event.side)}</span>
        </div>
      ))}
    </>
  );
}
