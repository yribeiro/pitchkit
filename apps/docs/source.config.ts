import { defineConfig, defineDocs } from "fumadocs-mdx/config";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    postprocess: {
      // Runs remarkLLMs during the MDX build so `page.data.getText("processed")`
      // is available — the plain-Markdown rendering of a page, with JSX
      // components resolved away, that /llms-full.txt and the per-page `.md`
      // routes serve. Without it that call throws at request time rather than
      // failing the build, so the flag and those routes ship together.
      includeProcessedMarkdown: true,
    },
  },
});

export default defineConfig();
