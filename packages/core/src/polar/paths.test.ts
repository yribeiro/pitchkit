import { describe, expect, it } from "vitest";
import { ringPath } from "./paths.js";

describe("ringPath", () => {
  it("draws a disc when the inner radius is 0", () => {
    expect(ringPath(50, 50, 0, 10)).toBe("M40 50a10 10 0 1 0 20 0a10 10 0 1 0 -20 0");
  });

  it("draws the outer circle then the inner one, for an even-odd ring", () => {
    expect(ringPath(50, 50, 5, 10)).toBe(
      "M40 50a10 10 0 1 0 20 0a10 10 0 1 0 -20 0M45 50a5 5 0 1 0 10 0a5 5 0 1 0 -10 0",
    );
  });
});
