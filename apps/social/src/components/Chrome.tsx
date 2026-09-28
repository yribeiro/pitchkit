import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, pitchVars } from "../theme";

/**
 * One solid near-black green background every post and reel shares, so the grid
 * reads as a set. Deliberately flat: the pitches carry the texture.
 */
export function Backdrop({ children }: { children?: ReactNode }) {
  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        fontFamily: FONT.sans,
        color: C.text,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

/** Wraps a `<Pitch>` with the brand's `--pitch-*` variables and label styling. */
export function PitchStage({
  children,
  style,
  labelSize = 22,
}: {
  children: ReactNode;
  style?: CSSProperties;
  labelSize?: number;
}) {
  return (
    <div className="pk-stage" style={{ ...pitchVars, ...style }}>
      {/* `<Annotate>` sets an inline 10px size (tuned for the docs); a phone
          screen needs labels several times bigger. */}
      <style>{`
        .pk-stage [data-pitchkit-mark="annotate"] {
          font-size: ${labelSize}px !important;
          font-family: ${FONT.sans};
          font-weight: 600;
          paint-order: stroke;
          stroke: rgba(6, 16, 11, 0.85);
          stroke-width: 5px;
          stroke-linejoin: round;
        }
      `}</style>
      {children}
    </div>
  );
}

export function Eyebrow({ children, color = C.accent }: { children: ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 24,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color,
      }}
    >
      {children}
    </div>
  );
}

export function Headline({ children, size = 76 }: { children: ReactNode; size?: number }) {
  return (
    <h1
      style={{
        margin: 0,
        fontSize: size,
        lineHeight: 1.04,
        fontWeight: 800,
        letterSpacing: "-0.035em",
      }}
    >
      {children}
    </h1>
  );
}

export function Sub({ children, size = 30 }: { children: ReactNode; size?: number }) {
  return (
    <p style={{ margin: 0, fontSize: size, lineHeight: 1.35, color: C.muted, fontWeight: 500 }}>
      {children}
    </p>
  );
}

/** Inline `code`-styled token, e.g. a component name. */
export function Tag({
  children,
  color = C.accent,
  size = 26,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
}) {
  return (
    <span
      style={{
        fontFamily: FONT.mono,
        fontSize: size,
        fontWeight: 600,
        color,
        background: "rgba(52, 211, 153, 0.09)",
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "6px 14px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/** The `npm i` pill used on intro and end cards. */
export function InstallPill({ size = 34 }: { size?: number }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.5,
        fontFamily: FONT.mono,
        fontSize: size,
        background: C.panel,
        border: `1.5px solid ${C.border}`,
        borderRadius: size * 0.5,
        padding: `${size * 0.5}px ${size * 0.9}px`,
        color: C.text,
      }}
    >
      <span style={{ color: C.emerald }}>$</span>
      <span>
        npm i <span style={{ color: C.emerald }}>@pitchkit/react</span>
      </span>
    </div>
  );
}

/**
 * The frame every wall post sits in: the headline block, the chart, and a data-credit footer.
 */
export function PostFrame({
  eyebrow,
  headline,
  sub,
  credit,
  children,
  headlineSize,
}: {
  eyebrow: ReactNode;
  headline: ReactNode;
  sub?: ReactNode;
  credit?: ReactNode;
  children: ReactNode;
  headlineSize?: number;
}) {
  return (
    <Backdrop>
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "72px 60px 48px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <Headline size={headlineSize}>{headline}</Headline>
          {sub && <Sub>{sub}</Sub>}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
            margin: "28px 0 24px",
          }}
        >
          {children}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 20,
            color: C.faint,
            fontFamily: FONT.mono,
          }}
        >
          <span>{credit}</span>
          <span style={{ color: C.muted }}>pitchkitjs.com</span>
        </div>
      </div>
    </Backdrop>
  );
}

/** A small legend dot + label. */
export function Key({ color, label, hollow }: { color: string; label: string; hollow?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        fontSize: 22,
        color: C.muted,
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: hollow ? "transparent" : color,
          border: `2.5px solid ${color}`,
        }}
      />
      {label}
    </span>
  );
}
