import { describe, expect, it } from "vitest";
import { LABEL_LINE_HEIGHT, labelPlacement, wrapLabel } from "./labels.js";

const deg = (d: number) => (d * Math.PI) / 180;

describe("labelPlacement: tangent", () => {
  it("runs along the rim at the top, stacking extra lines outward", () => {
    expect(labelPlacement(0, "tangent", 2)).toEqual({
      rotate: 0,
      anchor: "middle",
      dy: -LABEL_LINE_HEIGHT,
    });
  });

  it("turns labels below the equator 180° so they stay upright", () => {
    expect(labelPlacement(deg(180), "tangent")).toEqual({
      rotate: 360,
      anchor: "middle",
      dy: 0.75,
    });
    expect(labelPlacement(deg(135), "tangent").rotate).toBeCloseTo(315);
  });

  it("does not flip exactly at the quarter turns", () => {
    expect(labelPlacement(deg(90), "tangent").rotate).toBeCloseTo(90);
    expect(labelPlacement(deg(270), "tangent").rotate).toBeCloseTo(270);
  });

  it("normalises angles outside one turn", () => {
    expect(labelPlacement(deg(-90), "tangent").rotate).toBeCloseTo(270);
  });
});

describe("labelPlacement: radial", () => {
  it("reads outward along the axis on the right-hand side", () => {
    expect(labelPlacement(deg(90), "radial")).toEqual({ rotate: 0, anchor: "start", dy: 0.35 });
  });

  it("flips on the left-hand side so text reads left to right", () => {
    const placed = labelPlacement(deg(270), "radial");
    expect(placed.rotate).toBeCloseTo(360);
    expect(placed.anchor).toBe("end");
  });

  it("centres wrapped lines on the axis", () => {
    expect(labelPlacement(deg(90), "radial", 3).dy).toBeCloseTo(0.35 - LABEL_LINE_HEIGHT);
  });
});

describe("labelPlacement: horizontal", () => {
  it("anchors by side and stays upright", () => {
    expect(labelPlacement(deg(90), "horizontal")).toEqual({ rotate: 0, anchor: "start", dy: 0.35 });
    expect(labelPlacement(deg(270), "horizontal").anchor).toBe("end");
  });

  it("sits above the top axis and below the bottom one", () => {
    expect(labelPlacement(0, "horizontal", 2)).toEqual({
      rotate: 0,
      anchor: "middle",
      dy: -LABEL_LINE_HEIGHT,
    });
    expect(labelPlacement(deg(180), "horizontal").dy).toBe(0.75);
  });

  it("is the default rotation's fallback for one line", () => {
    expect(labelPlacement(deg(45), "horizontal").anchor).toBe("start");
  });
});

describe("wrapLabel", () => {
  it("keeps short labels on one line", () => {
    expect(wrapLabel("npxG", 10)).toEqual(["npxG"]);
  });

  it("wraps greedily at the limit", () => {
    expect(wrapLabel("Progressive passes received", 12)).toEqual([
      "Progressive",
      "passes",
      "received",
    ]);
    expect(wrapLabel("Key passes", 12)).toEqual(["Key passes"]);
  });

  it("keeps a one-character word with its neighbour", () => {
    expect(wrapLabel("Tackles + Int", 10)).toEqual(["Tackles", "+ Int"]);
    expect(wrapLabel("Goals & xG", 7)).toEqual(["Goals", "& xG"]);
    expect(wrapLabel("Turnovers ↓", 10)).toEqual(["Turnovers ↓"]);
  });

  it("never splits a long word and ignores extra spaces", () => {
    expect(wrapLabel("  Interceptions  ", 5)).toEqual(["Interceptions"]);
    expect(wrapLabel("", 5)).toEqual([]);
  });
});
