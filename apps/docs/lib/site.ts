/**
 * The canonical origin. Shared rather than repeated because it's baked into
 * absolute URLs in three unrelated places — `metadataBase` for social images,
 * the sitemap, and the links inside /llms.txt — and a stale copy in any of
 * them fails silently rather than loudly.
 */
export const SITE_URL = "https://pitchkitjs.com";
