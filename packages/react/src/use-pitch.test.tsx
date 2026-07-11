import { render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pitch } from "./Pitch.js";
import { usePitch } from "./use-pitch.js";

describe("usePitch", () => {
  it("returns dimensions/viewport/transform when called inside <Pitch>", () => {
    let captured: ReturnType<typeof usePitch> | undefined;

    function Probe() {
      captured = usePitch();
      return null;
    }

    render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Probe />
      </Pitch>,
    );

    expect(captured?.dimensions.pitchType).toBe("statsbomb");
    expect(captured?.viewport).toEqual({
      width: 600,
      height: 400,
      orientation: "horizontal",
      crop: undefined,
      padding: undefined,
    });
    expect(captured?.transform.toPixel([0, 0])).toEqual([0, 0]);
  });

  it("throws a specific error when called outside <Pitch>", () => {
    const { result } = renderHook(() => {
      try {
        return usePitch();
      } catch (error) {
        return error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toContain(
      "must be rendered inside <Pitch> or <VerticalPitch>",
    );
  });
});
