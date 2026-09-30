import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { PitchKitLockup } from "@/components/pitchkit-logo";
import { GitHubIcon, InstagramIcon, XIcon } from "@/components/social-icons";
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
        text: "Contact",
        url: `mailto:${CONTACT_EMAIL}`,
        external: true,
      },
      /*
       * Icon-only, so `label` is the accessible name (and the tooltip); the
       * glyph itself is aria-hidden. `on: "nav"` keeps them out of the mobile
       * dropdown, where the home layout already shows them in the bar itself.
       */
      {
        type: "icon",
        on: "nav",
        label: "PitchKit on GitHub",
        text: "GitHub",
        icon: <GitHubIcon />,
        url: GITHUB_URL,
        external: true,
      },
      {
        type: "icon",
        on: "nav",
        label: "PitchKit on X",
        text: "X",
        icon: <XIcon />,
        url: X_URL,
        external: true,
      },
      {
        type: "icon",
        on: "nav",
        label: "PitchKit on Instagram",
        text: "Instagram",
        icon: <InstagramIcon />,
        url: INSTAGRAM_URL,
        external: true,
      },
    ],
  };
}
