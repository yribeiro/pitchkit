import {
  defineCollections,
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from "fumadocs-mdx/config";
import { z } from "zod";

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

/**
 * Blog posts: flat MDX files in content/blog, served at /blog/<file name>.
 *
 * A separate collection rather than a folder under content/docs so posts stay
 * out of the docs sidebar, search tree and llms.txt; a post is dated writing,
 * not reference material that has to track the current release.
 *
 * `date` is a quoted ISO string ("2026-11-23"), not a YAML date: an unquoted
 * one parses to a Date at midnight UTC, which renders as the day before in
 * any timezone west of Greenwich.
 */
export const blog = defineCollections({
  type: "doc",
  dir: "content/blog",
  schema: frontmatterSchema.extend({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    author: z.string(),
    /** Posts that belong together, e.g. "Vibe coding football analysis". */
    series: z.string().optional(),
    /** 1-based position within `series`. */
    part: z.number().int().positive().optional(),
  }),
});

export default defineConfig();
