import { ImageResponse } from "next/og";

/**
 * The social card every share of pitchkitjs.com renders.
 *
 * 1200x630 is 1.9:1, which is close enough to a real pitch's 105:68 that a
 * full pitch actually fits here — the one surface in the whole identity where
 * drawing the literal thing is the right answer rather than the naive one. So
 * the mark carries the brand and a full UEFA pitch, at real marking
 * proportions, sits behind it as ground.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "PitchKit — Football visualised for the web";

/** A full UEFA pitch (105x68m) at real marking proportions. */
const PITCH = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 68" width="900" height="583">
  <g fill="none" stroke="#34d399" stroke-width="0.3" stroke-opacity="0.45">
    <rect x="0.25" y="0.25" width="104.5" height="67.5"/>
    <path d="M52.5 0.25V67.75"/>
    <circle cx="52.5" cy="34" r="9.15"/>
    <path d="M0.25 13.84h16.5v40.32H0.25M104.75 13.84h-16.5v40.32h16.5"/>
    <path d="M0.25 24.84h5.5v18.32H0.25M104.75 24.84h-5.5v18.32h5.5"/>
  </g>
  <g fill="#34d399" fill-opacity="0.45">
    <circle cx="52.5" cy="34" r="0.6"/><circle cx="11" cy="34" r="0.6"/><circle cx="94" cy="34" r="0.6"/>
  </g>
</svg>`;

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 48 48"
  fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <path d="M17 9H7v30h10"/><path d="M31 9h10v30H31"/>
  <path d="M24 9v9M24 30v9"/><circle cx="24" cy="24" r="6"/></svg>`;

/**
 * Base64, not `;utf8,` — the renderer behind ImageResponse (resvg) will not
 * parse an unencoded SVG data URI, and fails with an opaque
 * "svgload_buffer: SVG rendering failed" rather than anything actionable.
 */
const uri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "#08100d",
        padding: "0 84px",
        position: "relative",
      }}
    >
      {/* The pitch as ground, bleeding off the right edge. */}
      <img
        width={900}
        height={583}
        src={uri(PITCH)}
        alt=""
        style={{ position: "absolute", right: -300, top: 24 }}
      />

      {/* Scrim: fades the pitch into the ground so the copy keeps clean contrast
            however the text reflows. Declared before the content, so content paints
            on top of it. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "linear-gradient(90deg, #08100d 0%, #08100d 40%, rgba(8,16,13,0.55) 62%, rgba(8,16,13,0) 80%)",
        }}
      />

      <div style={{ display: "flex", alignItems: "center" }}>
        <img width={96} height={96} src={uri(MARK)} alt="" />
        <div
          style={{
            display: "flex",
            marginLeft: 24,
            fontSize: 82,
            fontWeight: 700,
            letterSpacing: "-0.035em",
          }}
        >
          <span style={{ color: "#e2ede8" }}>Pitch</span>
          <span style={{ color: "#34d399", marginLeft: -9 }}>Kit</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 28,
          fontSize: 34,
          color: "#a9bcb4",
          maxWidth: 540,
          lineHeight: 1.35,
        }}
      >
        A React-first football pitch visualisation library for the web.
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 42,
          fontSize: 24,
          color: "#74897f",
          letterSpacing: "0.04em",
        }}
      >
        pitchkitjs.com
      </div>
    </div>,
    size,
  );
}
