import {
  arcPathData,
  arcSweepFlag,
  computeGoalBox,
  computeStripeBands,
  goalBoxDepth,
  partStyle,
  resolveStripeCount,
} from "@pitchkit/core";
import type {
  Arc,
  Circle,
  Line,
  PitchAppearance,
  PitchDimensions,
  PitchGeometry,
  Point,
  PixelTransform,
  Rect,
} from "@pitchkit/core";
import { parseStyleString } from "./style-string.js";

/**
 * Emits a PitchGeometry as JSX, one element per shape — the React
 * equivalent of core's `paintPitchGeometry` (`render/svg/paint-pitch.ts`).
 * Deliberately re-emits rather than reusing core's DOM painter: JSX is
 * what makes this SSR-able and lets marks attach native React event
 * handlers. Every piece of *logic* (styling, stripe/goal-box geometry, arc
 * sweep math) is imported from core, not reimplemented — only the
 * DOM-vs-JSX element-emission layer differs, so the two renderers cannot
 * drift on anything but syntax.
 */
export function PitchGeometryShapes({
  geometry,
  transform,
  dimensions,
  appearance = {},
}: {
  geometry: PitchGeometry;
  transform: PixelTransform;
  dimensions: PitchDimensions;
  appearance?: PitchAppearance;
}) {
  const stripeCount = resolveStripeCount(appearance.stripes);
  const depth = goalBoxDepth(dimensions.markings.cornerArcRadius);
  const goalType = appearance.goalType ?? "line";

  return (
    <g data-pitchkit-layer="pitch">
      <RectShape rect={geometry.outline} transform={transform} part="outline" />
      {computeStripeBands(geometry.outline, stripeCount).map((band, i) => (
        <RectShape key={i} rect={band} transform={transform} part="stripe" />
      ))}

      <LineShape line={geometry.halfwayLine} transform={transform} part="halfway-line" />
      <CircleShape circle={geometry.centerCircle} transform={transform} part="center-circle" />
      <PointShape point={geometry.centerSpot} transform={transform} part="center-spot" />

      {geometry.penaltyAreas.map((rect, i) => (
        <RectShape key={i} rect={rect} transform={transform} part="penalty-area" />
      ))}
      {geometry.sixYardBoxes.map((rect, i) => (
        <RectShape key={i} rect={rect} transform={transform} part="six-yard-box" />
      ))}
      {geometry.penaltySpots.map((point, i) => (
        <PointShape key={i} point={point} transform={transform} part="penalty-spot" />
      ))}
      {geometry.penaltyArcs.map((arc, i) => (
        <ArcShape key={i} arc={arc} transform={transform} part="penalty-arc" />
      ))}
      {geometry.cornerArcs.map((arc, i) => (
        <ArcShape key={i} arc={arc} transform={transform} part="corner-arc" />
      ))}

      {goalType === "box" ? (
        <>
          <RectShape
            rect={computeGoalBox(geometry.goals[0], true, depth)}
            transform={transform}
            part="goal-box"
          />
          <RectShape
            rect={computeGoalBox(geometry.goals[1], false, depth)}
            transform={transform}
            part="goal-box"
          />
        </>
      ) : (
        geometry.goals.map((line, i) => (
          <LineShape key={i} line={line} transform={transform} part="goal" />
        ))
      )}
    </g>
  );
}

function RectShape({
  rect,
  transform,
  part,
}: {
  rect: Rect;
  transform: PixelTransform;
  part: string;
}) {
  const cornerA = transform.toPixel([rect.x, rect.y]);
  const cornerB = transform.toPixel([rect.x + rect.width, rect.y + rect.height]);
  const x = Math.min(cornerA[0], cornerB[0]);
  const y = Math.min(cornerA[1], cornerB[1]);

  return (
    <rect
      x={x}
      y={y}
      width={Math.abs(cornerB[0] - cornerA[0])}
      height={Math.abs(cornerB[1] - cornerA[1])}
      data-pitchkit-part={part}
      style={parseStyleString(partStyle(part))}
    />
  );
}

function LineShape({
  line,
  transform,
  part,
}: {
  line: Line;
  transform: PixelTransform;
  part: string;
}) {
  const [x1, y1] = transform.toPixel(line.from);
  const [x2, y2] = transform.toPixel(line.to);

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      data-pitchkit-part={part}
      style={parseStyleString(partStyle(part))}
    />
  );
}

function CircleShape({
  circle,
  transform,
  part,
}: {
  circle: Circle;
  transform: PixelTransform;
  part: string;
}) {
  const [cx, cy] = transform.toPixel(circle.center);

  return (
    <circle
      cx={cx}
      cy={cy}
      r={circle.radius * transform.scale}
      data-pitchkit-part={part}
      style={parseStyleString(partStyle(part))}
    />
  );
}

function PointShape({
  point,
  transform,
  part,
}: {
  point: Point;
  transform: PixelTransform;
  part: string;
}) {
  const [cx, cy] = transform.toPixel(point);

  return (
    <circle
      cx={cx}
      cy={cy}
      r={2}
      data-pitchkit-part={part}
      style={parseStyleString(partStyle(part))}
    />
  );
}

function ArcShape({ arc, transform, part }: { arc: Arc; transform: PixelTransform; part: string }) {
  const center = transform.toPixel(arc.center);
  const start = transform.toPixel(arc.start);
  const end = transform.toPixel(arc.end);
  const radius = arc.radius * transform.scale;
  const sweep = arcSweepFlag(center, start, end);

  return (
    <path
      d={arcPathData(radius, start, end, sweep)}
      data-pitchkit-part={part}
      style={parseStyleString(partStyle(part))}
    />
  );
}
