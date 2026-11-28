/**
 * One stage of a build, as the agent left it.
 *
 * Two images, because a desktop screenshot scaled down to a phone's width
 * turns every label into a smear: phones get the 390px render of the same
 * slide, which is shown at roughly its real size. Dimensions are required so
 * the page doesn't jump while they load.
 */
export function StageShot({
  name,
  alt,
  caption,
  desktop = [1280, 720],
  phone = [390, 844],
  wide = false,
}: {
  /** File stem under /blog/<slug>/stages, without `-desktop.webp` / `-phone.webp`. */
  name: string;
  alt: string;
  caption?: string;
  desktop?: [number, number];
  phone?: [number, number];
  /** Break out of the text column on large screens, for an image whose labels need the room. */
  wide?: boolean;
}) {
  const base = `/blog/vibe-code-a-post-match-report/stages/${name}`;
  return (
    <figure className={wide ? "not-prose my-6 lg:-mx-32" : "not-prose my-6"}>
      <picture>
        <source
          media="(max-width: 639px)"
          srcSet={`${base}-phone.webp`}
          width={phone[0]}
          height={phone[1]}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- static, pre-sized screenshots */}
        <img
          src={`${base}-desktop.webp`}
          alt={alt}
          width={desktop[0]}
          height={desktop[1]}
          loading="lazy"
          className="h-auto w-full rounded-xl border border-fd-border"
        />
      </picture>
      {caption ? (
        <figcaption className="mt-2 text-sm text-fd-muted-foreground">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
