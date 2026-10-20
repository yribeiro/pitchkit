import { describe as suite, expect, it } from "vitest";
import { describe, isRecord } from "./guards.js";

suite("isRecord", () => {
  it("accepts plain objects only", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord("x")).toBe(false);
  });
});

suite("describe", () => {
  it("names what arrived", () => {
    expect(describe(null)).toBe("null");
    expect(describe([1, 2, 3])).toBe("an array of 3");
    expect(describe({})).toBe("an empty object");
    expect(describe(42)).toBe("number");
    expect(describe(undefined)).toBe("undefined");
  });

  it("lists up to four keys, and says when there are more", () => {
    expect(describe({ a: 1, b: 2 })).toBe("an object with keys: a, b");
    expect(describe({ a: 1, b: 2, c: 3, d: 4, e: 5 })).toBe("an object with keys: a, b, c, d, ...");
  });
});
