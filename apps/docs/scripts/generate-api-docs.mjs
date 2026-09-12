// Generates content/docs/api/ from the two packages' TSDoc via TypeDoc +
// typedoc-plugin-markdown (issue #28 / PRD §9's "full API reference,
// generated from TSDoc, styled to match"). Invoked both from the npm
// "generate" script (for local dev/lint/typecheck) and synchronously from
// next.config.ts, because Vercel's Next.js framework preset runs
// `next build` directly against this app's Root Directory — bypassing
// package.json's "build" script (and any pre/post npm hooks) entirely.
// Output is gitignored, like the example registry.
//
// The plugin emits `.mdx` files that fumadocs-mdx compiles like any
// hand-written page, so the reference gets the site's full docs chrome
// (sidebar, TOC, theme) rather than being a bolted-on unstyled subsite. A
// post-pass adds fumadocs frontmatter (title from each page's H1) and
// rewrites the plugin's `.mdx`-suffixed relative links into extensionless
// URLs, which is all fumadocs needs.
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Application } from "typedoc";

function walkMdx(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkMdx(full));
    else if (entry.name.endsWith(".mdx")) files.push(full);
  }
  return files;
}

export async function generateApiDocs() {
  const docsRoot = fileURLToPath(new URL("..", import.meta.url));
  const outputDir = path.join(docsRoot, "content/docs/api");

  const app = await Application.bootstrapWithPlugins({
    plugin: ["typedoc-plugin-markdown"],
    // "packages" strategy: each package is documented under its package.json
    // name (via its own typedoc.json), then merged — cross-package type links
    // (react props referencing core types) resolve within one project.
    entryPointStrategy: "packages",
    entryPoints: [
      path.join(docsRoot, "../../packages/core"),
      path.join(docsRoot, "../../packages/react"),
    ],
    tsconfig: path.join(docsRoot, "scripts/typedoc.tsconfig.json"),
    out: outputDir,
    entryFileName: "index",
    // "@pitchkit/core" -> "core" in output paths/URLs.
    excludeScopesInPaths: true,
    readme: "none",
    // Make "Defined in" entries deterministic GitHub links ({path} relative
    // to basePath) rather than depending on local git state.
    disableGit: true,
    basePath: path.join(docsRoot, "../.."),
    sourceLinkTemplate: "https://github.com/yribeiro/pitchkit/blob/main/{path}#L{line}",
    // Internal-only exports (core's SVG painters, per issue #6) stay out of
    // the public reference.
    excludeInternal: true,
    excludePrivate: true,
    // Markdown-plugin options.
    fileExtension: ".mdx",
    hidePageHeader: true,
    hideBreadcrumbs: true,
    useCodeBlocks: true,
    interfacePropertiesFormat: "table",
    parametersFormat: "table",
    typeAliasPropertiesFormat: "table",
    enumMembersFormat: "table",
    // MDX treats a raw `<` as JSX; encode brackets in type names instead.
    useHTMLEncodedBrackets: true,
    sanitizeComments: true,
    logLevel: "Warn",
  });

  const project = await app.convert();
  if (!project) {
    throw new Error("generate-api-docs: TypeDoc conversion failed.");
  }

  rmSync(outputDir, { recursive: true, force: true });
  await app.generateOutputs(project);

  function postProcess() {
    for (const file of walkMdx(outputDir)) {
      let content = readFileSync(file, "utf8");

      // Title: first ATX heading, falling back to the file name.
      const headingMatch = content.match(/^# (.+)$/m);
      const fallback = path.basename(file, ".mdx");
      const rawTitle = headingMatch ? headingMatch[1] : fallback;
      // Headings arrive markdown/HTML-escaped (e.g. `Accessor\<T, V\>`); the
      // frontmatter title should be plain text.
      const title = rawTitle
        .replace(/\\([<>])/g, "$1")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/`/g, "")
        // "Interface: ScatterProps<T>" -> "ScatterProps": the kind is clear
        // from the sidebar grouping and page content, and bare symbol names
        // keep the sidebar scannable.
        .replace(/^[A-Za-z][A-Za-z ]*: /, "")
        .replace(/<.*>$/, "");
      if (headingMatch) {
        content = content.replace(headingMatch[0], "").replace(/^\n+/, "");
      }

      // The plugin links pages by relative *file* path (`.mdx` included).
      // Fumadocs URLs are extensionless and an index page's URL is its
      // directory, so relative hrefs can't survive as-is — resolve each one
      // to an absolute /docs/api/... URL instead (anchors preserved).
      const fileDir = path.posix.dirname(path.relative(outputDir, file).replaceAll(path.sep, "/"));
      content = content.replace(/\]\(([^)\s:]+)\.mdx(#[^)\s]*)?\)/g, (_, target, anchor = "") => {
        let resolved = path.posix.normalize(path.posix.join(fileDir === "." ? "" : fileDir, target));
        if (resolved === "index" || resolved.endsWith("/index")) {
          resolved = resolved.slice(0, -"index".length).replace(/\/$/, "");
        }
        return `](/docs/api${resolved ? `/${resolved}` : ""}${anchor})`;
      });

      // The per-package runs emit source URLs relative to the package root
      // while the display text is already repo-relative — rebuild each URL
      // from its display text so both agree.
      content = content.replace(
        /\[([\w./-]+\.tsx?):(\d+)\]\(https:\/\/github\.com\/yribeiro\/pitchkit\/blob\/main\/[^)]+\)/g,
        "[$1:$2](https://github.com/yribeiro/pitchkit/blob/main/$1#L$2)",
      );

      writeFileSync(file, `---\ntitle: "${title.replace(/"/g, '\\"')}"\n---\n\n${content}`);
    }
  }

  postProcess();

  // The generated root page is a bare two-link list — replace it with a
  // proper landing page for the reference section.
  writeFileSync(
    path.join(outputDir, "index.mdx"),
    `---
title: API Reference
description: Every public export of @pitchkit/core and @pitchkit/react, generated from TSDoc.
---

Generated from the source's TSDoc comments on every build — always in sync with the
published types. Anything marked \`@internal\` in the source (core's SVG painters, per
[issue #6](https://github.com/yribeiro/pitchkit/issues/6)) is deliberately excluded.

- **[@pitchkit/core](/docs/api/core)** — the framework-agnostic engine: coordinate
  transforms, pitch geometry, layer types, heatmap binning, theming tokens.
- **[@pitchkit/react](/docs/api/react)** — the officially supported React bindings:
  \`<Pitch>\`, the overlay components, and \`usePitch()\`.

For task-oriented documentation, start from the [guides](/docs/guides/coordinates) and
per-component pages instead — this section is the exhaustive symbol-level reference.
`,
  );

  // Fumadocs sidebar metadata for the generated tree.
  writeFileSync(
    path.join(outputDir, "meta.json"),
    `${JSON.stringify({ title: "API Reference", pages: ["index", "core", "react"] }, null, 2)}\n`,
  );

  console.log(`Generated API reference into ${path.relative(docsRoot, outputDir)}.`);
}

// Allow `node scripts/generate-api-docs.mjs` to keep working for the npm
// "generate" script, while next.config.ts imports generateApiDocs directly.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await generateApiDocs();
}
