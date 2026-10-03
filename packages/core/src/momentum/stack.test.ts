import { describe, expect, it } from "vitest";
import { stackOffsets } from "./stack.js";

describe("stackOffsets", () => {
  it("returns nothing for nothing", () => {
    expect(stackOffsets([], 12, 6)).toEqual([]);
  });

  it("leaves markers that already clear each other where they are", () => {
    expect(stackOffsets([10, 40, 80], 12, 6)).toEqual([10, 40, 80]);
  });

  it("leaves a lone marker alone", () => {
    expect(stackOffsets([25], 12, 6)).toEqual([25]);
  });

  it("fans a coincident pair out by one step, centred on where they were", () => {
    expect(stackOffsets([50, 50], 12, 6)).toEqual([47, 53]);
  });

  it("fans a run of three out evenly around its middle", () => {
    expect(stackOffsets([50, 50, 50], 12, 6)).toEqual([44, 50, 56]);
  });

  it("spreads markers that are close but not coincident to exactly one step", () => {
    const [a, b] = stackOffsets([50, 54], 12, 6);
    expect((b as number) - (a as number)).toBe(6);
  });

  it("keeps the input's order, not the sorted order", () => {
    const out = stackOffsets([80, 50, 50], 12, 6);
    expect(out[0]).toBe(80);
    expect(out[1]).toBe(47);
    expect(out[2]).toBe(53);
  });

  it("starts a new run once a marker clears the previous one", () => {
    // Two pairs far apart are centred independently.
    expect(stackOffsets([20, 20, 100, 100], 12, 6)).toEqual([17, 23, 97, 103]);
  });
});
