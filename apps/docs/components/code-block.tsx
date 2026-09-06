import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";

interface CodeBlockProps {
  code: string;
  lang: string;
}

/**
 * Read-only "view code" panel — copy button only, no in-browser editing
 * (Sandpack/react-live are explicitly out of scope for this skeleton, per
 * issue #17). Wraps fumadocs-ui's DynamicCodeBlock, which Shiki-highlights
 * an arbitrary source string at render time (unlike the static <CodeBlock>
 * used for MDX-authored fences, which expects pre-highlighted HTML).
 *
 * fumadocs-ui's default viewport only pads vertically and caps height at
 * 600px with a scrollbar — overridden here so the whole example is visible
 * without scrolling, and code doesn't touch the card's edges.
 */
export function CodeBlock({ code, lang }: CodeBlockProps) {
  return (
    <DynamicCodeBlock
      lang={lang}
      code={code}
      codeblock={{
        className: "m-0 rounded-none border-0 border-t shadow-none",
        viewportProps: { className: "max-h-none px-5" },
      }}
    />
  );
}
