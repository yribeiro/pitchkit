import { narrativePages, renderPages } from "@/lib/llms";

export const revalidate = false;

/** Every narrative page as one Markdown document; the API reference is at /llms-api.txt. */
export async function GET() {
  return new Response(await renderPages(narrativePages()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
