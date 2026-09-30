import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { PitchKitLockup } from "@/components/pitchkit-logo";
import { InstagramIcon, XIcon } from "@/components/social-icons";
import { CONTACT_EMAIL, GITHUB_URL, INSTAGRAM_URL, X_URL } from "@/lib/site";

/**
 * Options shared between the home layout and the docs layout (nav title,
 * links) — kept in one place so both stay in sync as the site grows past
 * this skeleton.
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <PitchKitLockup />,
    },
    links: [
      {
        text: "Docs",
        url: "/docs",
      },
      {
        text: "Gallery",
        url: "/gallery",
      },
      {
        text: "GitHub",
        url: GITHUB_URL,
        external: true,
      },
      {
        text: "Contact",
        url: `mailto:${CONTACT_EMAIL}`,
        external: true,
      },
      /*
       * Icon-only, so `label` is the accessible name (and the tooltip); the
       * glyph itself is aria-hidden.
       */
      {
        type: "icon",
        label: "PitchKit on X",
        text: "X",
        icon: <XIcon />,
        url: X_URL,
        external: true,
      },
      {
        type: "icon",
        label: "PitchKit on Instagram",
        text: "Instagram",
        icon: <InstagramIcon />,
        url: INSTAGRAM_URL,
        external: true,
      },
    ],
  };
}
