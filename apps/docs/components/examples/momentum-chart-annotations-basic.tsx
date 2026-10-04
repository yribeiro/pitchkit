"use client";

import { MomentumChart, useMomentumChart } from "@pitchkit/react";

const samples = [
  ...Array.from({ length: 10 }, (_, i) => ({
    minute: i * 5,
    period: 1,
    value: Math.round(8 * Math.sin(i / 1.6)),
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    minute: 45 + i * 5,
    period: 2,
    value: Math.round(9 * Math.cos(i / 1.4)),
  })),
];

// All three in the second half.
const substitutions = [60, 70, 78];

/**
 * A marker for something the built-in kinds don't cover. `scaleX` turns a
 * minute in a period (2 is the second half) into a pixel, and `frame` gives
 * the bars' rectangle, so this line runs the full height of the plot.
 */
function Change({ minute }: { minute: number }) {
  const { scaleX, frame } = useMomentumChart();
  const x = scaleX(minute, 2);

  return (
    <line
      x1={x}
      x2={x}
      y1={frame.y0}
      y2={frame.y1}
      strokeDasharray="2 3"
      style={{ stroke: "var(--pitch-chart-text)", strokeOpacity: 0.7 }}
    >
      <title>{`Substitution, ${minute}'`}</title>
    </line>
  );
}

export function MomentumChartAnnotationsBasic() {
  return (
    <MomentumChart
      data={samples}
      time={(d) => d.minute}
      period={(d) => d.period}
      value={(d) => d.value}
    >
      {substitutions.map((minute) => (
        <Change key={minute} minute={minute} />
      ))}
    </MomentumChart>
  );
}
