import { textWidth } from "../polar/labels.js";
import { GOAL_HEIGHT_METRES, GOAL_WIDTH_METRES } from "./frames.js";
import { GOAL_VIEW_HALF_WIDTH, projectGround } from "./layout.js";
import type { GoalLayout } from "./layout.js";

/** Pitch markings in front of the goal, in metres (IFAB Law 1). */
const SIX_YARD_DEPTH = 5.5;
const PENALTY_AREA_DEPTH = 16.5;
const PENALTY_SPOT_DEPTH = 11;
/** Posts and bar are 12 cm thick at most. */
const FRAME_THICKNESS = 0.12;
const NET_COLUMNS = 12;
const NET_ROWS = 4;

/** What the dimension markers measure in: `"7.32 m"` and `"2.44 m"`, or `"8 yd"` and `"8 ft"`. */
export type GoalMarkerUnits = "metric" | "imperial";

export interface GoalRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface GoalSegment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface GoalGroundMarking {
  readonly part: "goal-line" | "six-yard-box" | "penalty-area";
  readonly d: string;
}

/**
 * A measurement drawn beside the goal: a double-headed arrow, the two
 * extension lines it runs between, and its label on a backing box.
 */
export interface GoalDimensionMarker {
  readonly line: GoalSegment;
  /** One open arrowhead path per end. */
  readonly heads: readonly [string, string];
  readonly extensions: readonly [GoalSegment, GoalSegment];
  /**
   * The label and its backing box, or `undefined` when the box is wider than
   * the space the marker sits in: on a very small view the height label
   * would cover the left post.
   */
  readonly label?: { readonly x: number; readonly y: number; readonly text: string };
  readonly labelBox?: GoalRect;
}

export interface GoalGeometry {
  /** Everything above the goal line. */
  readonly backdrop: GoalRect;
  /** The ground in front of the goal. */
  readonly ground: GoalRect;
  readonly groundMarkings: readonly GoalGroundMarking[];
  /**
   * Where the penalty spot is, in perspective. Its position is to scale; its
   * size is not, since a real spot seen from this low reads as a dash.
   */
  readonly penaltySpot: {
    readonly cx: number;
    readonly cy: number;
    readonly rx: number;
    readonly ry: number;
  };
  /** The net behind the goal mouth. */
  readonly mouth: GoalRect;
  readonly net: readonly GoalSegment[];
  readonly posts: readonly [GoalRect, GoalRect];
  readonly crossbar: GoalRect;
  readonly fontSize: number;
  /** The distance between the posts, drawn above the crossbar. */
  readonly widthMarker: GoalDimensionMarker;
  /** The height to the crossbar, drawn left of the left post. */
  readonly heightMarker: GoalDimensionMarker;
}

const round = (value: number) => Math.round(value * 100) / 100;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function segment(x1: number, y1: number, x2: number, y2: number): GoalSegment {
  return { x1: round(x1), y1: round(y1), x2: round(x2), y2: round(y2) };
}

function rect(x: number, y: number, width: number, height: number): GoalRect {
  return { x: round(x), y: round(y), width: round(width), height: round(height) };
}

/** A path through ground points (metres right of centre, metres out). */
function groundPath(layout: GoalLayout, points: readonly (readonly [number, number])[]): string {
  return points
    .map(([u, depth], i) => {
      // Every marking is well in front of the camera, so this always projects.
      const [x, y] = projectGround(layout, u, depth) as [number, number];
      return `${i === 0 ? "M" : "L"}${round(x)} ${round(y)}`;
    })
    .join("");
}

/** An open arrowhead at (`x`, `y`) pointing along (`dx`, `dy`), a unit vector. */
function arrowHead(x: number, y: number, dx: number, dy: number, size: number): string {
  const backX = x - dx * size;
  const backY = y - dy * size;
  const spread = size * 0.6;
  return (
    `M${round(backX - dy * spread)} ${round(backY + dx * spread)}` +
    `L${round(x)} ${round(y)}` +
    `L${round(backX + dy * spread)} ${round(backY - dx * spread)}`
  );
}

function labelBox(x: number, y: number, text: string, fontSize: number): GoalRect {
  const padX = 4;
  const width = textWidth(text.length, fontSize) + 2 * padX;
  const height = fontSize + 6;
  return rect(x - width / 2, y - height / 2, width, height);
}

/**
 * A marker's label on its backing box, centred on (`x`, `y`), or nothing
 * when the box would be wider than `room`, the space the marker has.
 */
function markerLabel(
  x: number,
  y: number,
  text: string,
  fontSize: number,
  room: number,
): Pick<GoalDimensionMarker, "label" | "labelBox"> {
  const box = labelBox(x, y, text, fontSize);
  if (box.width + 4 > room) return {};
  return { label: { x: round(x), y: round(y), text }, labelBox: box };
}

/** The marker labels for each unit system. */
export function goalDimensionLabels(units: GoalMarkerUnits): { width: string; height: string } {
  return units === "imperial"
    ? { width: "8 yd", height: "8 ft" }
    : { width: `${GOAL_WIDTH_METRES} m`, height: `${GOAL_HEIGHT_METRES} m` };
}

/**
 * Every static shape of a goal view, in pixels: the backdrop and ground,
 * the markings on the ground in perspective, the net, the frame and the two
 * dimension markers. The goal view's counterpart to `computePitchGeometry`,
 * so no number is baked into a component.
 */
export function computeGoalGeometry(
  layout: GoalLayout,
  units: GoalMarkerUnits = "metric",
): GoalGeometry {
  const { scale, centreX, groundY } = layout;
  const half = GOAL_WIDTH_METRES / 2;
  const thickness = Math.max(FRAME_THICKNESS * scale, 2);
  const innerLeft = centreX - half * scale;
  const innerRight = centreX + half * scale;
  const barBottom = groundY - GOAL_HEIGHT_METRES * scale;
  const barTop = barBottom - thickness;
  const fontSize = round(clamp(scale * 0.17, 10, 13));
  const headSize = clamp(scale * 0.08, 3, 5);
  const labels = goalDimensionLabels(units);

  const sixYard = half + SIX_YARD_DEPTH;
  const penaltyArea = half + PENALTY_AREA_DEPTH;
  const groundMarkings: GoalGroundMarking[] = [
    {
      part: "goal-line",
      d: groundPath(layout, [
        [-GOAL_VIEW_HALF_WIDTH, 0],
        [GOAL_VIEW_HALF_WIDTH, 0],
      ]),
    },
    {
      part: "six-yard-box",
      d: groundPath(layout, [
        [-sixYard, 0],
        [-sixYard, SIX_YARD_DEPTH],
        [sixYard, SIX_YARD_DEPTH],
        [sixYard, 0],
      ]),
    },
    {
      part: "penalty-area",
      d: groundPath(layout, [
        [-penaltyArea, 0],
        [-penaltyArea, PENALTY_AREA_DEPTH],
        [penaltyArea, PENALTY_AREA_DEPTH],
        [penaltyArea, 0],
      ]),
    },
  ];

  const [spotX, spotY] = projectGround(layout, 0, PENALTY_SPOT_DEPTH) as [number, number];
  const spotRx = clamp(scale * 0.09, 2.5, 6);

  const net: GoalSegment[] = [];
  for (let column = 1; column < NET_COLUMNS; column++) {
    const x = innerLeft + ((innerRight - innerLeft) * column) / NET_COLUMNS;
    net.push(segment(x, barBottom, x, groundY));
  }
  for (let row = 1; row < NET_ROWS; row++) {
    const y = groundY - ((groundY - barBottom) * row) / NET_ROWS;
    net.push(segment(innerLeft, y, innerRight, y));
  }

  // Width: above the crossbar, halfway up the space over it, between the
  // inside edges of the posts (7.32 m is measured between them).
  const widthY = layout.top + (barTop - layout.top) / 2;
  const widthMarker: GoalDimensionMarker = {
    line: segment(innerLeft, widthY, innerRight, widthY),
    heads: [
      arrowHead(innerLeft, widthY, -1, 0, headSize),
      arrowHead(innerRight, widthY, 1, 0, headSize),
    ],
    extensions: [
      segment(innerLeft, barTop - 3, innerLeft, widthY - 6),
      segment(innerRight, barTop - 3, innerRight, widthY - 6),
    ],
    ...markerLabel(centreX, widthY, labels.width, fontSize, innerRight - innerLeft),
  };

  // Height: left of the left post, halfway across the space beside it, from
  // the ground to the underside of the bar (2.44 m is measured to it).
  const postOuter = innerLeft - thickness;
  const heightX = layout.left + (postOuter - layout.left) / 2;
  const heightMid = (groundY + barBottom) / 2;
  const heightMarker: GoalDimensionMarker = {
    line: segment(heightX, groundY, heightX, barBottom),
    heads: [
      arrowHead(heightX, groundY, 0, 1, headSize),
      arrowHead(heightX, barBottom, 0, -1, headSize),
    ],
    extensions: [
      segment(postOuter - 3, groundY, heightX - 6, groundY),
      segment(postOuter - 3, barBottom, heightX - 6, barBottom),
    ],
    ...markerLabel(heightX, heightMid, labels.height, fontSize, postOuter - layout.left),
  };

  return {
    backdrop: rect(layout.left, layout.top, layout.width, groundY - layout.top),
    ground: rect(layout.left, groundY, layout.width, layout.top + layout.height - groundY),
    groundMarkings,
    penaltySpot: { cx: round(spotX), cy: round(spotY), rx: round(spotRx), ry: round(spotRx / 2) },
    mouth: rect(innerLeft, barBottom, innerRight - innerLeft, groundY - barBottom),
    net,
    posts: [
      rect(postOuter, barTop, thickness, groundY - barTop),
      rect(innerRight, barTop, thickness, groundY - barTop),
    ],
    crossbar: rect(postOuter, barTop, innerRight - innerLeft + 2 * thickness, thickness),
    fontSize,
    widthMarker,
    heightMarker,
  };
}
