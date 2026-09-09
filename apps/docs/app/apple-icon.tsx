import { ImageResponse } from "next/og";

/**
 * The iOS home-screen icon. Unlike `icon.svg` this one needs a ground of its
 * own — iOS composites the icon onto whatever wallpaper is behind it and
 * applies its own rounded mask — so the mark sits on the brand's near-black
 * rather than on transparency.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 48 48"
  fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <path d="M17 9H7v30h10"/><path d="M31 9h10v30H31"/>
  <path d="M24 9v9M24 30v9"/><circle cx="24" cy="24" r="6"/></svg>`;

/**
 * Base64, not `;utf8,` — the renderer behind ImageResponse (resvg) will not
 * parse an unencoded SVG data URI, and fails with an opaque
 * "svgload_buffer: SVG rendering failed" rather than anything actionable.
 */
const uri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b1712",
      }}
    >
      {/* Satori requires numeric width/height here — strings are ignored. */}
      <img width={112} height={112} src={uri(MARK)} alt="" />
    </div>,
    size,
  );
}
