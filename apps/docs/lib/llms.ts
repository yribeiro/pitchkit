import { readFile } from "node:fs/promises";
import path from "node:path";
import { llms } from "fumadocs-core/source";
import type { InferPageType } from "fumadocs-core/source";
import { SITE_URL } from "./site";
import { source } from "./source";

/**
 * The docs tree's top-level folder whose children are the ~117 TypeDoc-generated
 * API pages. They're deliberately kept out of `/llms.txt` and `/llms-full.txt`
 * and served as `/llms-api.txt` instead: a symbol-per-page reference dump
 * crowds out the narrative docs that actually teach the library, and it's the
 * narrative docs an agent needs to answer "how do I build a shot map".
 * Fumadocs' own site excludes its API reference for the same reason.
 *
 * Matched on the URL rather than the tree node's title so a rename of the
 * sidebar label can't silently pull 117 pages into llms.txt.
 */
const API_PREFIX = "/docs/api";

export const isApiPage = (page: { url: string }) =>
  page.url === API_PREFIX || page.url.startsWith(`${API_PREFIX}/`);

const docsLlms = llms(source);

type DocsPage = InferPageType<typeof source>;

const allPages = () => source.getPages();

export const narrativePages = () => allPages().filter((page) => !isApiPage(page));
export const apiPages = () => allPages().filter(isApiPage);

/**
 * One page rendered as plain Markdown, headed by its title and canonical URL so
 * a model reading a concatenated dump can still attribute and link each section.
 *
 * `getText("processed")` is the remarkLLMs output enabled by
 * `postprocess.includeProcessedMarkdown` in source.config.ts. It resolves the
 * MDX down to Markdown but leaves custom components standing as literal JSX,
 * so `inlineExamples` substitutes the one component this site uses heavily
 * before the anchors are tidied off the headings.
 */
export async function renderPage(page: DocsPage): Promise<string> {
  const processed = await page.data.getText("processed");
  const body = stripHeadingAnchors(await inlineExamples(processed));
  const description = page.data.description ? `\n> ${page.data.description}\n` : "";

  return `# ${page.data.title}

Source: ${SITE_URL}${page.url}
${description}
${body.trim()}
`;
}

const EXAMPLES_DIR = path.join(process.cwd(), "components", "examples");
const PITCH_PREVIEW = /^[ \t]*<PitchPreview\s+name="([\w-]+)"\s*\/>[ \t]*$/gm;

/**
 * Replaces each `<PitchPreview name="…" />` with the example's actual source.
 *
 * On the site that tag renders a live pitch; as text it's an opaque reference,
 * and the overlay pages are mostly made of them — `/docs/overlays/scatter` is
 * one preview plus two sentences, so without this a model reading llms-full.txt
 * learns that `<Scatter>` exists and nothing about how to call it. The examples
 * are the page's real content, so they get substituted in rather than dropped.
 */
async function inlineExamples(markdown: string): Promise<string> {
  const names = [...markdown.matchAll(PITCH_PREVIEW)].map(([, name]) => name!);
  if (names.length === 0) return markdown;

  const sources = new Map(
    await Promise.all(names.map(async (name) => [name, await readExample(name)] as const)),
  );

  return markdown.replace(PITCH_PREVIEW, (match, name: string) => {
    const source = sources.get(name);
    return source ? `\`\`\`tsx\n${source}\n\`\`\`` : match;
  });
}

/**
 * The example's source, minus the parts that only make sense inside this site:
 * the `"use client"` directive, and the shared `docs-appearance` styling the
 * previews use to match the site's theme. Left in, they'd read as API a
 * consumer is meant to import, which is exactly the kind of plausible-looking
 * invention this whole effort exists to prevent.
 */
async function readExample(name: string): Promise<string | undefined> {
  let raw: string;
  try {
    raw = await readFile(path.join(EXAMPLES_DIR, `${name}.tsx`), "utf8");
  } catch {
    // A preview naming a missing example is a broken docs page, not a broken
    // llms.txt — leave the tag in place rather than silently emitting nothing.
    return undefined;
  }

  return raw
    .replace(/^"use client";\n+/, "")
    .replace(/^import .*from "\.\/docs-appearance";\n/gm, "")
    .replace(/^[ \t]*appearance=\{docs\w*Appearance\}\n/gm, "")
    .replace(/ appearance=\{docs\w*Appearance\}/g, "")
    .trim();
}

/**
 * Drops the `[#slug]` suffix remark leaves on headings. It's an anchor id for
 * the rendered page, and reads as stray syntax in plain Markdown.
 */
function stripHeadingAnchors(markdown: string): string {
  // `[ \t]`, not `\s`: the latter matches newlines, so a greedy trailing `\s*`
  // swallows the blank line after the heading and glues it to its paragraph.
  return markdown.replace(/^(#{1,6} .*?)[ \t]*\[#[\w-]+\][ \t]*$/gm, "$1");
}

/** Concatenated `renderPage` output, in the docs' own sidebar order. */
export async function renderPages(pages: DocsPage[]): Promise<string> {
  const rendered = await Promise.all(pages.map(renderPage));
  return rendered.join("\n\n---\n\n");
}

/**
 * The `/llms.txt` index: the spec's H1 + blockquote summary, then the docs tree
 * as nested links.
 *
 * Built per top-level tree node via `indexNode` rather than from the whole-tree
 * `index()`, because that's the only seam where the API folder can be dropped —
 * the output is one nested bullet list, so removing a section from the finished
 * string would mean re-parsing indentation to find where its children end.
 * Sections are emitted in sidebar order, so the index and the site can't
 * disagree about how the docs are organised.
 */
export function renderIndex(): string {
  const tree = source.pageTree.children
    .map((node) => docsLlms.indexNode(node))
    .filter((section) => !section.includes(`](${API_PREFIX}`))
    .join("\n")
    // Absolute, because llms.txt is read detached from the site that served
    // it — an agent handed the file's contents has no base URL to resolve
    // `/docs/...` against.
    .replaceAll("](/docs", `](${SITE_URL}/docs`);

  return `# PitchKit

> React-native football pitch visualisation for the web — mplsoccer's feature set, built for React and Next.js instead of matplotlib. Declarative \`<Pitch>\` + layer components, provider-native coordinates (StatsBomb, Opta, UEFA), responsive by default, themed with CSS variables.

PitchKit ships two packages: \`@pitchkit/core\` (zero-dependency coordinate transforms, geometry and Canvas painters) and \`@pitchkit/react\` (the only supported rendering surface). Composite recipes and theme presets are copied into your project rather than imported.

Every page below is also available as raw Markdown by appending \`.md\` to its URL.

## Docs

${tree.trim()}

## Optional

- [Full documentation](${SITE_URL}/llms-full.txt): every narrative page above, concatenated as Markdown.
- [API reference](${SITE_URL}/llms-api.txt): the generated per-symbol TypeDoc reference, kept out of the above because of its size.
`;
}
