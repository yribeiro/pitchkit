/**
 * Maps a `data-pitchkit-part` to its default presentation as an inline
 * `style` string referencing themeable CSS variables with built-in
 * fallbacks (PRD §8.7). Consumers retheme by setting the `--pitch-*`
 * variables — never by overriding these shapes' fill/stroke directly.
 *
 * Shared verbatim between the SVG DOM renderer and @pitchkit/react's JSX
 * emission, so the two can never drift on pitch-part styling.
 */
export function partStyle(part: string): string {
  const lineStroke = "stroke: var(--pitch-lines, rgba(255, 255, 255, 0.8));";
  const lineWidth = "stroke-width: var(--pitch-line-width, 1.5);";

  switch (part) {
    case "surface":
      return "fill: var(--pitch-surface, #1a472a); stroke: none;";
    case "stripe":
      return "fill: var(--pitch-stripe, rgba(255, 255, 255, 0.04)); stroke: none;";
    case "center-spot":
    case "penalty-spot":
      return "fill: var(--pitch-lines, rgba(255, 255, 255, 0.8)); stroke: none;";
    default:
      return `fill: none; ${lineStroke} ${lineWidth}`;
  }
}
