import { describe, expect, it } from "vitest";
import { resolve } from "./resolve.js";

describe("resolve", () => {
  it("returns a static value unchanged", () => {
    expect(resolve(42, { id: 1 }, 0)).toBe(42);
    expect(resolve("var(--pitch-lines)", { id: 1 }, 0)).toBe("var(--pitch-lines)");
  });

  it("calls a function accessor with the datum and index", () => {
    const data: { value: number }[] = [{ value: 10 }, { value: 20 }];
    const accessor = (d: { value: number }, i: number) => d.value + i;

    expect(resolve(accessor, data[0]!, 0)).toBe(10);
    expect(resolve(accessor, data[1]!, 1)).toBe(21);
  });
});
