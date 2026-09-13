/**
 * The half of the social-card machinery that is plain data, kept out of
 * `og-card.tsx` because that module pulls in `react-dom/server` (to render the
 * mark from its React component) and Next forbids that import anywhere in a
 * Server Component's graph — which `app/docs/[[...slug]]/page.tsx` is.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * The per-page docs card route (`app/docs/og/[...slugs]/route.ts`). Docs pages
 * point `openGraph.images` here from `generateMetadata`; the docs index borrows
 * the slug `index` because the route's catch-all is non-optional.
 */
export const docsOgImageUrl = (slugs: string[]) => `/docs/og/${slugs.join("/") || "index"}`;
