import { useId, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  GOAL_FRAMES,
  GOAL_VIEW_ASPECT,
  computeGoalGeometry,
  computeGoalLayout,
  goalPoint,
  pitchTokens,
} from "@pitchkit/core";
import type {
  GoalDimensionMarker,
  GoalFrameId,
  GoalMarkerUnits,
  GoalSegment,
} from "@pitchkit/core";
import type { TooltipState } from "./context.js";
import { GoalViewContext } from "./goal-view-context.js";
import { TooltipOverlay, hasTooltipContent } from "./TooltipOverlay.js";
import { useResizeObserver } from "./use-resize-observer.js";

export interface GoalViewAppearance {
  /** The distance between the posts, drawn above the crossbar. @default true */
  readonly widthMarker?: boolean;
  /** The height of the crossbar, drawn left of the left post. @default true */
  readonly heightMarker?: boolean;
  /** `"7.32 m"` and `"2.44 m"`, or `"8 yd"` and `"8 ft"`. @default "metric" */
  readonly units?: GoalMarkerUnits;
}

export interface GoalViewProps {
  /**
   * The coordinate system of the shots you plot: `"statsbomb"` for a shot's
   * `end_location[1]` and `[2]` in yards, or `"metric"` for metres from the
   * middle of the goal.
   */
  type: GoalFrameId;
  /** Fixed pixel size — the opt-out from the responsive default. Provide both, or neither. */
  width?: number;
  height?: number;
  appearance?: GoalViewAppearance;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** The size laid out against before the container is measured (SSR, first paint). */
const NOMINAL_WIDTH = 600;

const token = (name: string, fallback: string) => `var(${name}, ${fallback})`;
const BACKDROP = token(pitchTokens.goalBackdrop, "#0f2a19");
const GROUND = token(pitchTokens.surface, "#1a472a");
const LINES = token(pitchTokens.lines, "rgba(255, 255, 255, 0.8)");
const LINE_WIDTH = token(pitchTokens.lineWidth, "1.5");
const NET = token(pitchTokens.goalNet, "rgba(255, 255, 255, 0.18)");
const FRAME = token(pitchTokens.goalFrame, "#ffffff");

function SegmentLine({ segment, style }: { segment: GoalSegment; style: CSSProperties }) {
  return <line x1={segment.x1} y1={segment.y1} x2={segment.x2} y2={segment.y2} style={style} />;
}

function DimensionMarker({
  part,
  marker,
  fontSize,
}: {
  part: string;
  marker: GoalDimensionMarker;
  fontSize: number;
}) {
  const { labelBox: box, label } = marker;
  return (
    <g data-pitchkit-part={part} opacity={0.75}>
      {marker.extensions.map((extension, i) => (
        <SegmentLine
          key={i}
          segment={extension}
          style={{ stroke: LINES, strokeWidth: 1, strokeDasharray: "2 2", opacity: 0.6 }}
        />
      ))}
      <SegmentLine segment={marker.line} style={{ stroke: LINES, strokeWidth: 1.25 }} />
      {marker.heads.map((d, i) => (
        <path
          key={i}
          d={d}
          style={{ fill: "none", stroke: LINES, strokeWidth: 1.25, strokeLinejoin: "round" }}
        />
      ))}
      {box && label && (
        <>
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            rx={3}
            style={{ fill: BACKDROP }}
          />
          <text
            x={label.x}
            y={label.y}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fill: LINES, fontSize, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}
          >
            {label.text}
          </text>
        </>
      )}
    </g>
  );
}

/**
 * The goal mouth seen from in front, the way a shooter sees it: posts,
 * crossbar and net drawn to scale, with the ground receding to the
 * six-yard line, the penalty spot and the penalty area so the distance
 * reads at a glance.
 *
 * A root, a sibling of `<Pitch>` rather than a layer inside one (D29). It
 * owns its own coordinate system, chosen by `type`, and is responsive by
 * default. Shots are children: `<GoalShots>`, or your own marks placed with
 * `useGoalView()`.
 */
export function GoalView({
  type,
  width: explicitWidth,
  height: explicitHeight,
  appearance,
  className,
  style,
  children,
}: GoalViewProps) {
  const frame = GOAL_FRAMES[type];
  const [containerRef, measuredSize] = useResizeObserver<HTMLDivElement>();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  // useId's colons are legal in an id but not inside url(#…).
  const clipId = `pitchkit-goal-${useId().replace(/:/g, "")}`;

  const isExplicitSize = explicitWidth !== undefined && explicitHeight !== undefined;
  const fallbackSize = {
    width: NOMINAL_WIDTH,
    height: Math.round(NOMINAL_WIDTH / GOAL_VIEW_ASPECT),
  };
  const size = isExplicitSize
    ? { width: explicitWidth, height: explicitHeight }
    : (measuredSize ?? fallbackSize);

  const layout = computeGoalLayout(size.width, size.height);
  const geometry = computeGoalGeometry(layout, appearance?.units);
  const showWidth = appearance?.widthMarker ?? true;
  const showHeight = appearance?.heightMarker ?? true;
  const lineStyle: CSSProperties = { fill: "none", stroke: LINES, strokeWidth: LINE_WIDTH };
  const { backdrop, ground, mouth, crossbar, penaltySpot } = geometry;

  return (
    <div
      ref={isExplicitSize ? undefined : containerRef}
      className={className}
      style={{
        position: "relative",
        width: isExplicitSize ? explicitWidth : "100%",
        height: isExplicitSize ? explicitHeight : undefined,
        aspectRatio: isExplicitSize ? undefined : GOAL_VIEW_ASPECT,
        ...style,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size.width} ${size.height}`}
        style={{ display: "block" }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={ground.x} y={ground.y} width={ground.width} height={ground.height} />
          </clipPath>
        </defs>
        <g data-pitchkit-layer="goal">
          <rect
            data-pitchkit-part="goal-backdrop"
            x={backdrop.x}
            y={backdrop.y}
            width={backdrop.width}
            height={backdrop.height}
            style={{ fill: BACKDROP }}
          />
          <rect
            data-pitchkit-part="goal-ground"
            x={ground.x}
            y={ground.y}
            width={ground.width}
            height={ground.height}
            style={{ fill: GROUND }}
          />
          <g clipPath={`url(#${clipId})`}>
            {geometry.groundMarkings.map((marking) => (
              <path
                key={marking.part}
                data-pitchkit-part={marking.part}
                d={marking.d}
                style={lineStyle}
              />
            ))}
            <ellipse
              data-pitchkit-part="penalty-spot"
              cx={penaltySpot.cx}
              cy={penaltySpot.cy}
              rx={penaltySpot.rx}
              ry={penaltySpot.ry}
              style={{ fill: LINES }}
            />
          </g>
          <g data-pitchkit-part="goal-net">
            {geometry.net.map((segment, i) => (
              <SegmentLine key={i} segment={segment} style={{ stroke: NET, strokeWidth: 1 }} />
            ))}
            <rect
              x={mouth.x}
              y={mouth.y}
              width={mouth.width}
              height={mouth.height}
              style={{ fill: "none", stroke: NET, strokeWidth: 1 }}
            />
          </g>
          {geometry.posts.map((post, i) => (
            <rect
              key={i}
              data-pitchkit-part="goal-post"
              x={post.x}
              y={post.y}
              width={post.width}
              height={post.height}
              style={{ fill: FRAME }}
            />
          ))}
          <rect
            data-pitchkit-part="goal-crossbar"
            x={crossbar.x}
            y={crossbar.y}
            width={crossbar.width}
            height={crossbar.height}
            style={{ fill: FRAME }}
          />
          {showWidth && (
            <DimensionMarker
              part="goal-width-marker"
              marker={geometry.widthMarker}
              fontSize={geometry.fontSize}
            />
          )}
          {showHeight && (
            <DimensionMarker
              part="goal-height-marker"
              marker={geometry.heightMarker}
              fontSize={geometry.fontSize}
            />
          )}
        </g>
        <GoalViewContext.Provider
          value={{
            frame,
            layout,
            toPixel: (y, z, inset) => goalPoint(layout, frame, y, z, inset),
            setTooltip,
          }}
        >
          {children}
        </GoalViewContext.Provider>
      </svg>
      {hasTooltipContent(tooltip) && <TooltipOverlay tooltip={tooltip} />}
    </div>
  );
}
