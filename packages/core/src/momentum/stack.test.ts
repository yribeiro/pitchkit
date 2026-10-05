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

  it("never re-centres a run onto the marker before it (#83)", () => {
    // 100 is clear of the run at 114-117, so it stays put. Centring the run
    // on its true minutes would pull it back to 105, 5px from 100.
    const out = stackOffsets([100, 114, 115, 116, 117], 13, 7);

    expect(out[0]).toBe(100);
    expect((out[1] as number) - (out[0] as number)).toBeGreaterThanOrEqual(13);
    // Still a stack, one step apart.
    expect(out.slice(1).map((x, i) => x - (out[i] as number))).toEqual([13, 7, 7, 7]);
  });

  it("re-centres a run fully when there is room before it", () => {
    expect(stackOffsets([10, 100, 100], 12, 6)).toEqual([10, 97, 103]);
  });

  it("respects a run before it that has itself been re-centred", () => {
    // The first pair centres to 17/23. The second run, at 40, would centre
    // to 34, 11px from 23; it can come back no closer than 23 + 12.
    const out = stackOffsets([20, 20, 40, 40, 40], 12, 6);

    expect(out.slice(0, 2)).toEqual([17, 23]);
    expect((out[2] as number) - 23).toBeGreaterThanOrEqual(12);
  });
});
