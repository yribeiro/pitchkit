import { useMemo, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  stackOffsets,
  barAtMinute,
  computeChartFrame,
  computeMomentumBars,
  createLinearScale,
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
import { useResizeObserver } from "./use-resize-observer.js";

const CHART_TEXT = "var(--pitch-chart-text, #12170f)";
const CHART_MUTED = "var(--pitch-chart-muted, #7b8474)";
const AXIS = "var(--pitch-axis, #c6cebc)";
const GRID = "var(--pitch-grid, #e5eade)";

const NOMINAL_WIDTH = 720;
const DEFAULT_ASPECT_RATIO = 3;
/**
 * Below this width a 3:1 box leaves a plot too short to read a bar's height
 * in, so the chart gets a taller one. Phone-width only.
 */
const NARROW_WIDTH = 420;
const NARROW_ASPECT_RATIO = 1.8;

/** The gap between periods, in pixels. */
const PERIOD_GAP = 8;
/** Icons shrink on a phone, where a 16px one is a twentieth of the chart. */
const ICON_SIZE = 13;
const NARROW_ICON_SIZE = 11;
/** How many rows the event strip may grow to before markers share one. */
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
    periods,
    time,
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

  const [containerRef, measuredSize] = useResizeObserver<HTMLDivElement>();
  const [hover, setHover] = useState<{ panel: number; minute: number } | null>(null);

  const resolved = resolveAppearance(appearance, teams !== undefined);

  const isExplicitSize = explicitWidth !== undefined && explicitHeight !== undefined;
  const isNarrow =
    (isExplicitSize ? explicitWidth : (measuredSize?.width ?? NOMINAL_WIDTH)) < NARROW_WIDTH;
  const aspectRatio =
    explicitAspectRatio ?? (isNarrow ? NARROW_ASPECT_RATIO : DEFAULT_ASPECT_RATIO);
  const size = isExplicitSize
    ? { width: explicitWidth, height: explicitHeight }
    : (measuredSize ?? { width: NOMINAL_WIDTH, height: Math.round(NOMINAL_WIDTH / aspectRatio) });

  // Accessors are resolved here and core is handed plain numbers. Each period
  // is turned into bars twice: once unclipped, to find where its data really
  // ends, and once clipped to the range that produces.
  const computed = useMemo(() => {
    const samples = periods.map((period) =>
      period.map((datum, i) => ({
        time: resolve(time, datum, i),
        value: resolve(value, datum, i),
      })),
    );
    const ranges: MomentumRange[] = samples.map((sample, index) => {
      const unclipped = computeMomentumBars(sample);
      const latestEnd =
        unclipped.length > 0 ? (unclipped[unclipped.length - 1] as MomentumBar).end : undefined;
      const natural = resolvePeriodRange(index, latestEnd);
      const override = periodRanges?.[index];
      return { start: override?.start ?? natural.start, end: override?.end ?? natural.end };
    });
    const bars = samples.map((sample, index) => computeMomentumBars(sample, ranges[index]));
    const values = bars.flatMap((periodBars) => periodBars.map((bar) => bar.value));
    return { ranges, bars, values };
  }, [periods, time, value, periodRanges]);

  const extent = explicitMaxValue ?? momentumExtent(computed.values);

  // Horizontal layout depends only on the width and side padding, so it can be
  // settled before the bottom padding — which depends on how many lanes the
  // event strip needs, and that depends on where the events land horizontally.
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
      : eventProps.events.map((datum, i) => ({
          datum,
          minute: resolve(eventProps.eventTime, datum, i),
          side: resolve(eventProps.eventSide, datum, i),
          kind: resolve(eventProps.eventKind, datum, i),
          label:
            eventProps.eventLabel === undefined
              ? undefined
              : resolve(eventProps.eventLabel, datum, i),
        }));

  /** The x of a minute, in whichever period holds it or the nearest one. */
  function xOfMinute(minute: number): number {
    const inside = panels.find((p) => minute >= p.start && minute <= p.end);
    if (inside !== undefined) return inside.scale(minute);

    const nearest = panels.reduce(
      (best, p) => {
        const distance = minute < p.start ? p.start - minute : minute - p.end;
        const bestDistance = minute < best.start ? best.start - minute : minute - best.end;
        return distance < bestDistance ? p : best;
      },
      panels[0] as (typeof panels)[number],
    );
    return nearest === undefined
      ? 0
      : nearest.scale(Math.min(Math.max(minute, nearest.start), nearest.end));
  }

  const iconSize = isNarrow ? NARROW_ICON_SIZE : ICON_SIZE;
  // The event strip is one row: the icon, and room for a team underline.
  const stripHeight = iconSize + 6;

  // Icons that would touch fan out into a shallow stack, each a little right
  // of the last and painted over it, so the row never grows taller.
  const trueXs = placedEvents.map((event) => (panels.length > 0 ? xOfMinute(event.minute) : 0));
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
    scaleX: xOfMinute,
    bars: computed.bars,
  };

  let hoverInfo: MomentumHover<T, E> | null = null;
  if (hover !== null) {
    const bar = barAtMinute(computed.bars[hover.panel] ?? [], hover.minute);
    // With no bar under the pointer, events within half a minute still count.
    const window = bar ?? { start: hover.minute - 0.5, end: hover.minute + 0.5 };
    hoverInfo = {
      minute: hover.minute,
      period: hover.panel,
      bar,
      datum: bar === undefined ? undefined : periods[hover.panel]?.[bar.index],
      events: placedEvents
        .filter((event) => event.minute >= window.start && event.minute < window.end)
        .map((event) => event.datum),
    };
  }

  useDismissOnOutsidePress(containerRef, hover !== null, () => setHover(null));

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
    const panel = panels.find((p) => x >= p.x0 && x <= p.x1);
    // The gap between periods is not a minute of the match.
    if (panel === undefined) return setHover(null);
    const minute = Math.min(Math.max(panel.scale.invert(x), panel.start), panel.end);
    setHover({ panel: panel.index, minute });
  }

  const eventsTop = frame.y1 + (resolved.axis ? AXIS_HEIGHT : 4);

  return (
    <div
      ref={containerRef}
      className={className}
      data-pitchkit-layer="momentum"
      style={{
        position: "relative",
        width: isExplicitSize ? explicitWidth : "100%",
        height: isExplicitSize ? explicitHeight : undefined,
        aspectRatio: isExplicitSize ? undefined : aspectRatio,
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
                <circle
                  cx={x}
                  cy={y}
                  r={iconSize / 2 + 1}
                  style={{ fill: "var(--pitch-chart-surface, #ffffff)" }}
                />
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

          {hover !== null && panels[hover.panel] !== undefined && (
            <line
              data-pitchkit-part="momentum-crosshair"
              x1={(panels[hover.panel] as (typeof panels)[number]).scale(hover.minute)}
              y1={frame.y0}
              x2={(panels[hover.panel] as (typeof panels)[number]).scale(hover.minute)}
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

      {hoverInfo !== null && hover !== null && panels[hover.panel] !== undefined && (
        <ChartReadout
          left={
            ((panels[hover.panel] as (typeof panels)[number]).scale(hover.minute) / frame.width) *
            100
          }
          top={(frame.y0 / frame.height) * 100}
        >
          {tooltip !== undefined ? (
            tooltip(hoverInfo)
          ) : (
            <DefaultReadout hover={hoverInfo} teams={teams} placed={placedEvents} />
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
  placed,
}: {
  hover: MomentumHover<T, E>;
  teams: MomentumTeams | undefined;
  placed: readonly {
    datum: E;
    side: MomentumSide;
    kind: MomentumEventKind;
    label: string | undefined;
  }[];
}): ReactNode {
  const side: MomentumSide | null =
    hover.bar === undefined || hover.bar.value === 0 ? null : hover.bar.value > 0 ? "home" : "away";
  const teamName = (s: MomentumSide) => teams?.[s] ?? (s === "home" ? "Home" : "Away");
  const events = placed.filter((event) => hover.events.includes(event.datum));

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
