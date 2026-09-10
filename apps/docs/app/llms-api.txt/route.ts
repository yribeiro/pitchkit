import { apiPages, renderPages } from "@/lib/llms";

export const revalidate = false;

/** The generated TypeDoc reference, split out of /llms-full.txt on size grounds. */
export async function GET() {
  return new Response(await renderPages(apiPages()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
