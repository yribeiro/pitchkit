import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { PitchKitMark } from "@/components/pitchkit-logo";
import { OG_SIZE } from "./og-meta";

export { OG_CONTENT_TYPE, OG_SIZE, docsOgImageUrl } from "./og-meta";

const GROUND = "#08100d";
const ACCENT = "#34d399";

/**
 * A full UEFA pitch (105x68m) at real marking proportions, with an optional
 * overlay of data-viz marks in the same viewBox so each page's card previews
 * the kind of visualisation that page is about.
 */
export const pitchUri = (overlay = "") =>
  uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 68" width="900" height="583">
  <g fill="none" stroke="${ACCENT}" stroke-width="0.3" stroke-opacity="0.45">
    <rect x="0.25" y="0.25" width="104.5" height="67.5"/>
    <path d="M52.5 0.25V67.75"/>
    <circle cx="52.5" cy="34" r="9.15"/>
    <path d="M0.25 13.84h16.5v40.32H0.25M104.75 13.84h-16.5v40.32h16.5"/>
    <path d="M0.25 24.84h5.5v18.32H0.25M104.75 24.84h-5.5v18.32h5.5"/>
  </g>
  <g fill="${ACCENT}" fill-opacity="0.45">
    <circle cx="52.5" cy="34" r="0.6"/><circle cx="11" cy="34" r="0.6"/><circle cx="94" cy="34" r="0.6"/>
  </g>
  ${overlay}
</svg>`);

/**
 * Shot map: chances clustered off the centre circle, goals ringed. Kept to
 * x >= 30 of the 105-wide viewBox: the pitch bleeds off the card's right edge,
 * so only its left two-thirds are on-card, and the scrim darkens the rest.
 */
export const shotsOverlay = `<g fill="${ACCENT}">
    <circle cx="44" cy="16" r="1" fill-opacity="0.5"/><circle cx="40" cy="50" r="1.2" fill-opacity="0.55"/>
    <circle cx="38" cy="24" r="1.4" fill-opacity="0.65"/><circle cx="36" cy="44" r="1.1" fill-opacity="0.6"/>
    <circle cx="34" cy="20" r="1.3" fill-opacity="0.7"/><circle cx="33" cy="40" r="1.6" fill-opacity="0.8"/>
    <circle cx="35" cy="30" r="1.2" fill-opacity="0.75"/>
  </g>
  <g fill="none" stroke="${ACCENT}" stroke-width="0.5">
    <circle cx="31" cy="35" r="1.8"/><circle cx="32" cy="26" r="1.5"/><circle cx="30" cy="38" r="1.6"/>
  </g>`;

/** Tracking data: a few player paths sweeping at the left penalty area. */
export const trackingOverlay = `<g fill="none" stroke="${ACCENT}" stroke-width="0.5" stroke-linecap="round">
    <path d="M68 52C58 48 52 36 38 30" stroke-opacity="0.7"/>
    <path d="M64 20C54 24 46 30 34 26" stroke-opacity="0.5"/>
    <path d="M66 34C52 34 44 44 32 44" stroke-opacity="0.6"/>
    <path d="M60 60C50 56 42 50 31 50" stroke-opacity="0.4"/>
  </g>
  <g fill="${ACCENT}" fill-opacity="0.85">
    <circle cx="38" cy="30" r="1.1"/><circle cx="34" cy="26" r="1.1"/>
    <circle cx="32" cy="44" r="1.1"/><circle cx="31" cy="50" r="1.1"/>
  </g>`;

/** Pass network: nodes in a shape, linked by pass lines. */
export const networkOverlay = `<g stroke="${ACCENT}" stroke-width="0.4" stroke-opacity="0.55">
    <path d="M62 44L52 30M52 30L44 36M52 30L48 16M44 36L36 30M62 44L50 50M50 50L44 36M50 50L38 44M38 44L36 30"/>
  </g>
  <g fill="${ACCENT}" fill-opacity="0.85">
    <circle cx="62" cy="44" r="1.4"/><circle cx="52" cy="30" r="1.4"/><circle cx="48" cy="16" r="1.4"/>
    <circle cx="44" cy="36" r="1.4"/><circle cx="50" cy="50" r="1.4"/><circle cx="38" cy="44" r="1.4"/>
    <circle cx="36" cy="30" r="1.4"/>
  </g>`;

/**
 * Base64, not `;utf8,` — the renderer behind ImageResponse (resvg) will not
 * parse an unencoded SVG data URI, and fails with an opaque
 * "svgload_buffer: SVG rendering failed" rather than anything actionable.
 */
function uri(svg: string) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export interface OgCardOptions {
  /**
   * `"title"` puts the mark + wordmark lockup up at hero size (the site card);
   * `"badge"` shrinks it to a top-left brand row so the page's own title leads
   * (every per-page card).
   */
  brand: "title" | "badge";
  title: ReactNode;
  titleSize?: number;
  description: string;
  descriptionSize?: number;
  /** Small caps-green section line above the title, e.g. "DOCS · DATA". */
  eyebrow?: string;
  /** SVG fragment drawn inside the pitch, in the 105x68 viewBox. */
  overlay?: string;
}

/**
 * The one social-card layout every share of pitchkitjs.com renders, so a
 * page's card is recognisably the same object as the site's — same ground,
 * same pitch bleeding off the right edge, same scrim — with the page's own
 * title, description and data-viz overlay swapped in.
 */
export function ogCard({
  brand,
  title,
  titleSize = 56,
  description,
  descriptionSize = 30,
  eyebrow,
  overlay,
}: OgCardOptions) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: GROUND,
        padding: "0 84px",
        position: "relative",
      }}
    >
      {/* The pitch as ground, bleeding off the right edge. */}
      <img
        width={900}
        height={583}
        src={pitchUri(overlay)}
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
          background: `linear-gradient(90deg, ${GROUND} 0%, ${GROUND} 40%, rgba(8,16,13,0.55) 62%, rgba(8,16,13,0) 80%)`,
        }}
      />

      {brand === "badge" && (
        <div style={{ display: "flex", alignItems: "center", marginBottom: 40 }}>
          <PitchKitMark size={40} stroke={ACCENT} />
          <div
            style={{
              display: "flex",
              marginLeft: 12,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "-0.035em",
            }}
          >
            <span style={{ color: "#e2ede8" }}>Pitch</span>
            <span style={{ color: ACCENT, marginLeft: -3 }}>Kit</span>
          </div>
        </div>
      )}

      {eyebrow && (
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: ACCENT,
            letterSpacing: "0.18em",
            marginBottom: 18,
          }}
        >
          {eyebrow}
        </div>
      )}

      {brand === "title" ? (
        <div style={{ display: "flex", alignItems: "center" }}>
          <PitchKitMark size={96} stroke={ACCENT} />
          <div
            style={{
              display: "flex",
              marginLeft: 24,
              fontSize: titleSize,
              fontWeight: 700,
              letterSpacing: "-0.035em",
            }}
          >
            {title}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            fontSize: titleSize,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#e2ede8",
            maxWidth: 620,
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>
      )}

      <div
        style={{
          display: "flex",
          marginTop: 28,
          fontSize: descriptionSize,
          color: "#a9bcb4",
          maxWidth: 540,
          lineHeight: 1.35,
        }}
      >
        {description}
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
    OG_SIZE,
  );
}
