import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { PitchKitLockup } from "@/components/pitchkit-logo";

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
        url: "https://github.com/yribeiro/pitchkit",
        external: true,
      },
    ],
  };
}
