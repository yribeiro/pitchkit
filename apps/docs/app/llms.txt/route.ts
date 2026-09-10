import { renderIndex } from "@/lib/llms";

// Built once at build time and served statically: the index is derived from the
// page tree, which can't change between deploys.
export const revalidate = false;

export function GET() {
  return new Response(renderIndex(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
