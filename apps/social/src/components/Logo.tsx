import { C, FONT } from "../theme";

/**
 * The PitchKit mark — geometry copied verbatim from
 * assets/brand/pitchkit-mark.svg (see that folder's README before changing it).
 */
export function Mark({ size = 48, color = C.emerald }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 9H7v30h10" />
      <path d="M31 9h10v30H31" />
      <path d="M24 9v9M24 30v9" />
      <circle cx="24" cy="24" r="6" />
    </svg>
  );
}

/** Mark + wordmark on one line. */
export function Lockup({ size = 44 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.28 }}>
      <Mark size={size} />
      <span
        style={{
          fontFamily: FONT.sans,
          fontWeight: 700,
          fontSize: size * 0.72,
          letterSpacing: "-0.02em",
          color: C.text,
        }}
      >
        PitchKit
      </span>
    </div>
  );
}
