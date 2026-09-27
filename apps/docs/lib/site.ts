/**
 * The canonical origin. Shared rather than repeated because it's baked into
 * absolute URLs in four unrelated places — `metadataBase` for social images,
 * every page's canonical, the sitemap, and the links inside /llms.txt — and a
 * stale copy in any of them fails silently rather than loudly.
 *
 * **It must match the host Vercel actually serves, including the `www`.** The
 * apex 308-redirects to `www`, so while this said `https://pitchkitjs.com`
 * every canonical pointed at a URL that redirected, all ~470 sitemap entries
 * cost a hop, and any fetcher that does not follow redirects — which includes
 * some of the agent crawlers these absolute URLs exist for — got a bodyless
 * 308 instead of the page.
 *
 * If the Vercel domain settings are ever flipped so the apex is primary and
 * `www` redirects to it, change this back in the same commit; the two have to
 * agree, and nothing here can detect that they have stopped agreeing.
 */
export const SITE_URL = "https://www.pitchkitjs.com";

/**
 * Where to reach the maintainer, and where bugs go instead. Shared because the
 * homepage footer and the nav on every page both link to them.
 */
export const CONTACT_EMAIL = "yohahnribeiro29@gmail.com";
export const GITHUB_URL = "https://github.com/yribeiro/pitchkit";
export const ISSUES_URL = `${GITHUB_URL}/issues`;

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
