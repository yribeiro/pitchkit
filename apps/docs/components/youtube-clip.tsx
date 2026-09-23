interface YouTubeClipProps {
  /** The video id, i.e. the `v=` parameter of a watch URL. */
  id: string;
  /** Title for the iframe — read out by screen readers, so describe the clip. */
  title: string;
  /** Start offset in seconds. */
  start?: number;
  /**
   * Stop offset in seconds. YouTube honours this by halting playback, but the
   * viewer can still scrub past it — it's a clip, not a trim.
   */
  end?: number;
}

/**
 * A YouTube clip, scoped to a start/end offset.
 *
 * `youtube-nocookie.com` is the privacy-preserving host: it serves the same
 * player but doesn't set tracking cookies unless the video actually plays.
 * `loading="lazy"` keeps the player's payload off the initial load of a page
 * that is already fetching a few MB of match data.
 *
 * In the Markdown/llms.txt exports this tag is replaced by a plain timestamped
 * link — see `youTubeLink` in lib/llms.ts. An iframe is meaningless as text,
 * and a model reading the page should still be told the clip exists.
 */
export function YouTubeClip({ id, title, start, end }: YouTubeClipProps) {
  const params = new URLSearchParams({ rel: "0" });
  if (start !== undefined) params.set("start", String(start));
  if (end !== undefined) params.set("end", String(end));

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-fd-border bg-fd-card">
      <div className="relative aspect-video">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?${params}`}
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
