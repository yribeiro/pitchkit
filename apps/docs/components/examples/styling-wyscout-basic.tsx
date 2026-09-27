"use client";

import { WYSCOUT_TAGS } from "@pitchkit/data-providers/wyscout";
import type { WyscoutEvent } from "@pitchkit/data-providers/wyscout";
import { Arrows, Pitch, Scatter } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

/** Just the fields this chart reads, under Wyscout's own names. */
type Event = Pick<WyscoutEvent, "eventName" | "tags" | "x" | "y" | "endX" | "endY">;

const accurate = [{ id: WYSCOUT_TAGS.ACCURATE }];
const onTarget = [{ id: WYSCOUT_TAGS.ACCURATE }, { id: WYSCOUT_TAGS.OPPORTUNITY }];

// Wyscout coordinates: 0–100 on both axes, origin top-left, y pointing DOWN —
// the vertical mirror of Opta, so plotting one on the other's type flips it.
const move: Event[] = [
  { eventName: "Pass", tags: accurate, x: 18, y: 71, endX: 34, endY: 88 },
  { eventName: "Pass", tags: accurate, x: 34, y: 88, endX: 52, endY: 80 },
  { eventName: "Pass", tags: accurate, x: 52, y: 80, endX: 49, endY: 46 },
  { eventName: "Pass", tags: accurate, x: 49, y: 46, endX: 73, endY: 22 },
  { eventName: "Pass", tags: accurate, x: 73, y: 22, endX: 88, endY: 41 },
  // A shot has no end coordinate in Wyscout data — where it went is recorded
  // in goal-mouth tags instead — so it gets a marker, not an arrow.
  { eventName: "Shot", tags: onTarget, x: 88, y: 41 },
];

const passes = move.filter((e) => e.eventName === "Pass");
const shots = move.filter((e) => e.eventName === "Shot");

/**
 * A Wyscout build-up on a classic broadcast-green pitch with heavy white
 * markings (`pitch-line-width-2`). The same passes-then-shot split the
 * data forces — shots have no end location — is also the split the styling
 * wants: arrows for passes, a marker for the shot.
 */
export function StylingWyscoutBasic() {
  return (
    <Pitch
      type="wyscout"
      appearance={docsAppearance}
      className="pitch-surface-green-700 pitch-stripe-green-600 pitch-lines-white pitch-line-width-2"
    >
      <Arrows
        data={passes}
        x={(e) => e.x}
        y={(e) => e.y}
        x2={(e) => e.endX ?? e.x}
        y2={(e) => e.endY ?? e.y}
        className="fill-white stroke-white"
      />
      <Scatter
        data={shots}
        x={(e) => e.x}
        y={(e) => e.y}
        r={7}
        strokeWidth={2}
        className="fill-yellow-300 stroke-green-900"
      />
    </Pitch>
  );
}
