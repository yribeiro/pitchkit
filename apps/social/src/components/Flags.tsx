/**
 * National flags drawn in SVG, so the reels need no third-party crest
 * artwork. Proportions follow each flag's official ratio, scaled to `height`.
 */
export function FlagArgentina({ height = 48 }: { height?: number }) {
  const w = (height * 14) / 9;
  const rays = Array.from({ length: 16 }, (_, i) => (i * Math.PI) / 8);
  return (
    <svg
      width={w}
      height={height}
      viewBox="0 0 140 90"
      style={{ borderRadius: 6, display: "block" }}
    >
      <rect width="140" height="90" fill="#74acdf" />
      <rect y="30" width="140" height="30" fill="#ffffff" />
      <g transform="translate(70 45)" fill="#f6b40e" stroke="#85340a" strokeWidth="0.8">
        {rays.map((a, i) => (
          <path
            key={i}
            d={`M ${Math.cos(a - 0.12) * 6} ${Math.sin(a - 0.12) * 6} L ${Math.cos(a) * (i % 2 ? 12 : 13.5)} ${Math.sin(a) * (i % 2 ? 12 : 13.5)} L ${Math.cos(a + 0.12) * 6} ${Math.sin(a + 0.12) * 6} Z`}
          />
        ))}
        <circle r="6.5" />
      </g>
    </svg>
  );
}

export function FlagFrance({ height = 48 }: { height?: number }) {
  const w = (height * 3) / 2;
  return (
    <svg width={w} height={height} viewBox="0 0 3 2" style={{ borderRadius: 6, display: "block" }}>
      <rect width="1" height="2" fill="#002654" />
      <rect x="1" width="1" height="2" fill="#ffffff" />
      <rect x="2" width="1" height="2" fill="#ce1126" />
    </svg>
  );
}
