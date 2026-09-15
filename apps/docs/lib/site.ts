/**
 * The canonical origin. Shared rather than repeated because it's baked into
 * absolute URLs in three unrelated places — `metadataBase` for social images,
 * the sitemap, and the links inside /llms.txt — and a stale copy in any of
 * them fails silently rather than loudly.
 */
export const SITE_URL = "https://pitchkitjs.com";

/**
 * The landing page's own headline and subhead.
 *
 * They live here rather than inline in the hero because three surfaces have to
 * agree on them: the `<h1>`/`<p>` a visitor lands on, the `og:`/`twitter:` card
 * a shared link previews as, and the text baked into the generated OG image.
 * They had already drifted into three different taglines once — a shared link
 * promised "A React-first football pitch visualisation library for the web" and
 * opened a page saying something else — which is exactly the mismatch a reader
 * reads as a stale or wrong link.
 */
export const TAGLINE = "Football visualised for the web.";
export const SUBHEAD = "The React library built for the beautiful game. Your design, your way.";

/**
 * What a search engine or AI answer engine reads.
 *
 * Deliberately not `TAGLINE`/`SUBHEAD`: this one names the thing in the words
 * people actually type — React, TypeScript, charting library, football.
 * PitchKit's own voice ("mplsoccer for the web") only lands for people who
 * already know mplsoccer, which is precisely the audience that does not need
 * to find the site by searching for it.
 */
export const SEARCH_DESCRIPTION =
  "PitchKit is a React and TypeScript charting library for football (soccer) data " +
  "visualisation — pitches, shot maps, pass networks, heatmaps and tracking data as " +
  "composable React components. Works with Next.js, themed with CSS variables, MIT licensed.";
