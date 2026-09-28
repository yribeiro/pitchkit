import type { ReactNode } from "react";
import { C, FONT } from "../theme";

const SYNTAX = {
  keyword: "#c792ea",
  string: "#a5e3b6",
  component: C.emerald,
  prop: "#7dd3fc",
  number: "#fbbf24",
  comment: "#5c7066",
  punct: "#9fb3a8",
  plain: C.text,
} as const;

const KEYWORDS = new Set([
  "import",
  "from",
  "const",
  "await",
  "export",
  "function",
  "return",
  "type",
]);

/**
 * Just enough of a JSX tokenizer for marketing snippets: comments, strings,
 * keywords, `<Component`, `prop=`, numbers. Not a parser — the snippets are
 * hand-written and short.
 */
function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern =
    /(\/\/.*$)|("[^"]*")|(<\/?[A-Z][A-Za-z]*)|(\b[a-zA-Z]+(?==))|(\b\d+(?:\.\d+)?\b)|(\b[a-z]+\b)|([^\w\s]+)|(\s+)|(\w+)/g;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(line)) !== null) {
    const [text, comment, string, component, prop, number, word, punct] = match;
    let color: string = SYNTAX.plain;
    if (comment) color = SYNTAX.comment;
    else if (string) color = SYNTAX.string;
    else if (component) color = SYNTAX.component;
    else if (prop) color = SYNTAX.prop;
    else if (number) color = SYNTAX.number;
    else if (word && KEYWORDS.has(word)) color = SYNTAX.keyword;
    else if (punct) color = SYNTAX.punct;
    out.push(
      <span key={key++} style={{ color }}>
        {text}
      </span>,
    );
  }
  return out;
}

/**
 * A code panel. `reveal` (0..1) types the snippet out character by
 * character for reels; `highlightLines` dims every other line.
 */
export function Code({
  code,
  size = 24,
  reveal = 1,
  highlightLines,
  title,
  cursor = false,
}: {
  code: string;
  size?: number;
  reveal?: number;
  highlightLines?: readonly number[];
  title?: string;
  cursor?: boolean;
}) {
  const total = code.length;
  const shown = code.slice(0, Math.round(total * Math.min(Math.max(reveal, 0), 1)));
  const lines = shown.split("\n");

  return (
    <div
      style={{
        background: "rgba(8, 20, 14, 0.92)",
        border: `1.5px solid ${C.border}`,
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "16px 22px",
          borderBottom: `1px solid ${C.border}`,
          fontFamily: FONT.mono,
          fontSize: size * 0.8,
          color: C.faint,
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((dot) => (
          <span
            key={dot}
            style={{ width: 13, height: 13, borderRadius: "50%", background: dot, opacity: 0.85 }}
          />
        ))}
        <span style={{ marginLeft: 12 }}>{title}</span>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "22px 28px 24px",
          fontFamily: FONT.mono,
          fontSize: size,
          lineHeight: 1.55,
          whiteSpace: "pre",
        }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              opacity: highlightLines && !highlightLines.includes(i) ? 0.35 : 1,
              minHeight: size * 1.55,
            }}
          >
            {highlight(line)}
            {cursor && i === lines.length - 1 && (
              <span
                style={{
                  display: "inline-block",
                  width: size * 0.55,
                  height: size * 1.1,
                  background: C.emerald,
                  verticalAlign: "text-bottom",
                  marginLeft: 2,
                }}
              />
            )}
          </div>
        ))}
      </pre>
    </div>
  );
}
