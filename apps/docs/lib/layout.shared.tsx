import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { PitchKitLockup } from "@/components/pitchkit-logo";
import { CONTACT_EMAIL, GITHUB_URL } from "@/lib/site";

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
    ],
  };
}
