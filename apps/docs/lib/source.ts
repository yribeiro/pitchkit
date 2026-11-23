import { loader } from "fumadocs-core/source";
import { toFumadocsSource } from "fumadocs-mdx/runtime/server";
import { blog as blogPosts, docs } from "../.source/server";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});

export const blog = loader({
  baseUrl: "/blog",
  source: toFumadocsSource(blogPosts, []),
});

/** Newest first. Dates are ISO strings, so they sort lexically. */
export const blogPostsByDate = () =>
  [...blog.getPages()].sort((a, b) => b.data.date.localeCompare(a.data.date));

/** "23 November 2026". Formatted as UTC so the server and the browser agree. */
export const formatPostDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
