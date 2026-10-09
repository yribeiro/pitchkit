import { describe, expect, it } from "vitest";
import { computeGoalGeometry, goalDimensionLabels } from "./geometry.js";
import { computeGoalLayout, projectGround } from "./layout.js";

describe("computeGoalGeometry", () => {
  const layout = computeGoalLayout(1000, 400);
  const geometry = computeGoalGeometry(layout);

  it("splits the view at the goal line into backdrop and ground", () => {
    expect(geometry.backdrop.y).toBeCloseTo(layout.top, 2);
    expect(geometry.backdrop.y + geometry.backdrop.height).toBeCloseTo(layout.groundY, 2);
    expect(geometry.ground.y).toBeCloseTo(layout.groundY, 2);
    expect(geometry.ground.y + geometry.ground.height).toBeCloseTo(layout.top + layout.height, 2);
    expect(geometry.backdrop.width).toBeCloseTo(layout.width, 2);
  });

  it("draws the mouth 7.32 m by 2.44 m, between the inside edges of the frame", () => {
    expect(geometry.mouth.width).toBeCloseTo(7.32 * layout.scale, 1);
    expect(geometry.mouth.height).toBeCloseTo(2.44 * layout.scale, 1);
    const [left, right] = geometry.posts;
    expect(left.x + left.width).toBeCloseTo(geometry.mouth.x, 2);
    expect(right.x).toBeCloseTo(geometry.mouth.x + geometry.mouth.width, 2);
    expect(geometry.crossbar.y + geometry.crossbar.height).toBeCloseTo(geometry.mouth.y, 2);
    expect(left.y + left.height).toBeCloseTo(layout.groundY, 2);
  });

  it("keeps the frame visible when the view is small", () => {
    const small = computeGoalGeometry(computeGoalLayout(120, 50));
    expect(small.crossbar.height).toBe(2);
    expect(small.fontSize).toBe(10);
  });

  it("caps the label size on a large view", () => {
    expect(computeGoalGeometry(computeGoalLayout(3000, 1200)).fontSize).toBe(13);
  });

  it("strings a net of 12 columns and 4 rows inside the mouth", () => {
    expect(geometry.net).toHaveLength(11 + 3);
    for (const line of geometry.net) {
      expect(line.x1).toBeGreaterThanOrEqual(geometry.mouth.x - 0.01);
      expect(line.x2).toBeLessThanOrEqual(geometry.mouth.x + geometry.mouth.width + 0.01);
    }
  });

  it("puts the penalty spot 11 m out, on the middle", () => {
    const [x, y] = projectGround(layout, 0, 11) as [number, number];
    expect(geometry.penaltySpot.cx).toBeCloseTo(x, 2);
    expect(geometry.penaltySpot.cy).toBeCloseTo(y, 2);
    expect(geometry.penaltySpot.ry).toBeCloseTo(geometry.penaltySpot.rx / 2, 2);
  });

  it("draws the goal line, six-yard box and penalty area in order of depth", () => {
    expect(geometry.groundMarkings.map((m) => m.part)).toEqual([
      "goal-line",
      "six-yard-box",
      "penalty-area",
    ]);
    const lineY = (d: string) => Number(d.split("L")[1]?.split(" ")[1]);
    const [goalLine, sixYard, penaltyArea] = geometry.groundMarkings.map((m) => lineY(m.d));
    expect(goalLine).toBeCloseTo(layout.groundY, 2);
    expect(sixYard).toBeGreaterThan(goalLine as number);
    expect(penaltyArea).toBeGreaterThan(geometry.penaltySpot.cy);
    expect(penaltyArea).toBeLessThan(layout.top + layout.height);
  });

  it("measures the width between the posts, above the bar", () => {
    const marker = geometry.widthMarker;
    expect(marker.line.x1).toBeCloseTo(geometry.mouth.x, 2);
    expect(marker.line.x2).toBeCloseTo(geometry.mouth.x + geometry.mouth.width, 2);
    expect(marker.line.y1).toBeLessThan(geometry.crossbar.y);
    expect(marker.line.y1).toBeGreaterThan(layout.top);
    expect(marker.label).toEqual({
      x: marker.line.x1 + (marker.line.x2 - marker.line.x1) / 2,
      y: marker.line.y1,
      text: "7.32 m",
    });
    expect((marker.labelBox?.x ?? 0) + (marker.labelBox?.width ?? 0) / 2).toBeCloseTo(
      marker.label?.x ?? NaN,
      1,
    );
    for (const extension of marker.extensions) {
      expect(extension.y1).toBeGreaterThan(extension.y2);
    }
  });

  it("measures the height from the ground to the bar, left of the left post", () => {
    const marker = geometry.heightMarker;
    expect(marker.line.y1).toBeCloseTo(layout.groundY, 2);
    expect(marker.line.y2).toBeCloseTo(geometry.mouth.y, 2);
    expect(marker.line.x1).toBeGreaterThan(layout.left);
    expect(marker.line.x1).toBeLessThan(geometry.posts[0].x);
    expect(marker.label?.text).toBe("2.44 m");
    expect(marker.labelBox?.x).toBeGreaterThan(layout.left);
  });

  it("points each arrowhead at its end of the line", () => {
    const [left, right] = geometry.widthMarker.heads;
    const tip = (d: string) => d.split("L")[1]?.split("L")[0];
    expect(tip(left)).toBe(`${geometry.widthMarker.line.x1} ${geometry.widthMarker.line.y1}`);
    expect(tip(right)).toBe(`${geometry.widthMarker.line.x2} ${geometry.widthMarker.line.y2}`);
  });

  it("drops the height label where it would cover the left post (#97 review)", () => {
    const small = computeGoalGeometry(computeGoalLayout(160, 160 / 2.568));
    expect(small.heightMarker.label).toBeUndefined();
    expect(small.heightMarker.labelBox).toBeUndefined();
    // The arrow still measures, and the width label still fits between the posts.
    expect(small.heightMarker.line.y1).toBeGreaterThan(small.heightMarker.line.y2);
    expect(small.widthMarker.label?.text).toBe("7.32 m");
  });

  it("keeps every label clear of the frame and inside the view at any width it draws", () => {
    for (const width of [160, 190, 240, 360, 600, 1200]) {
      const layout = computeGoalLayout(width, width / 2.568);
      const geometry = computeGoalGeometry(layout);
      const box = geometry.heightMarker.labelBox;
      if (!box) continue;
      expect(box.x).toBeGreaterThanOrEqual(layout.left);
      expect(box.x + box.width).toBeLessThanOrEqual(geometry.posts[0].x);
    }
  });

  it("labels in imperial units on request", () => {
    const imperial = computeGoalGeometry(layout, "imperial");
    expect(imperial.widthMarker.label?.text).toBe("8 yd");
    expect(imperial.heightMarker.label?.text).toBe("8 ft");
  });
});

describe("goalDimensionLabels", () => {
  it("gives metres by default and yards and feet for imperial", () => {
    expect(goalDimensionLabels("metric")).toEqual({ width: "7.32 m", height: "2.44 m" });
    expect(goalDimensionLabels("imperial")).toEqual({ width: "8 yd", height: "8 ft" });
  });
});
