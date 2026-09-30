import type { ComponentPropsWithoutRef } from "react";

/**
 * The PitchKit mark: two penalty areas, the halfway line, and the centre
 * circle — which read simultaneously as `[ ]` code brackets. Drawn on a
 * 48-unit grid at stroke 3, so it rasterises to whole pixels at 16/24/32px.
 *
 * Painted in `currentColor` deliberately: one file inherits the nav's colour,
 * flips with the theme toggle, and knocks out on a solid accent, so there is
 * no light/dark variant to keep in sync. That's the same discipline as the
 * library's CSS-variable-only theming (docs/architecture.md#theming-and-styling).
 *
 * The favicon is a separate cut — `app/icon.svg`, at stroke 3.5 — because
 * browsers rasterise it at 16px and hairlines go grey.
 */
export function PitchKitMark({
  size = 24,
  ...props
}: { size?: number } & ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...props}
    >
      <path d="M17 9H7v30h10" />
      <path d="M31 9h10v30H31" />
      <path d="M24 9v9M24 30v9" />
      <circle cx="24" cy="24" r="6" />
    </svg>
  );
}

/**
 * Horizontal lockup for the nav. The accent lands on the camel-case "Kit"
 * — the natural break in the word, and the one place a second colour adds
 * information rather than decoration.
 */
export function PitchKitLockup() {
  return (
    <span className="inline-flex items-center gap-2">
      <PitchKitMark size={22} className="text-fd-primary" />
      <span className="text-[15px] font-semibold tracking-tight">
        Pitch<span className="text-fd-primary">Kit</span>
      </span>
    </span>
  );
}
