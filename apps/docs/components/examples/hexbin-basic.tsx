"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Hexbin, Pitch } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

/**
 * A deterministic stand-in for a full match's touch data — hexbin only
 * earns its keep at densities where listing every point inline would be
 * unreadable. Seeded so the docs render identically on every build.
 */
function generateTouches(count: number) {
  let seed = 20260909;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  // Box-Muller, so touches cluster around a centre-of-gravity in the
  // attacking half rather than spreading uniformly across the pitch.
  const normal = () =>
    Math.sqrt(-2 * Math.log(random() || 1e-9)) * Math.cos(2 * Math.PI * random());

  // Rounded to 2dp deliberately: `Math.log`/`Math.cos` are allowed to
  // differ in the last bit between engines, so full-precision coordinates
  // would differ between the server render and the browser.
  const round = (value: number) => Math.round(value * 100) / 100;

  return Array.from({ length: count }, () => ({
    x: round(Math.min(119, Math.max(1, 72 + normal() * 22))),
    y: round(Math.min(79, Math.max(1, 40 + normal() * 17))),
  }));
}

const PITCH_ASPECT = 120 / 80;
const FALLBACK_WIDTH = 480;

/**
 * `<Hexbin>` paints to a canvas, which needs a fixed pixel size up front,
 * so this example measures its own container (the same technique
 * `<Pitch>` uses internally) rather than leaning on <Pitch>'s responsive
 * mode.
 */
export function HexbinBasic() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  const touches = useMemo(() => generateTouches(600), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      <Pitch
        type="statsbomb"
        width={width}
        height={Math.round(width / PITCH_ASPECT)}
        appearance={docsAppearance}
      >
        <Hexbin
          data={touches}
          x={(t) => t.x}
          y={(t) => t.y}
          binsX={18}
          colorMin="#0f3d24"
          colorMax="#facc15"
          stroke="rgba(0, 0, 0, 0.25)"
          strokeWidth={0.5}
          style={{ opacity: 0.9 }}
        />
      </Pitch>
    </div>
  );
}
