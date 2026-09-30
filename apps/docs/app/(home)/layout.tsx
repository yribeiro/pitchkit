import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactNode } from "react";
import { SocialLinks } from "@/components/social-icons";
import { baseOptions } from "@/lib/layout.shared";

export default function Layout({ children }: { children: ReactNode }) {
  const options = baseOptions();
  return (
    <HomeLayout
      {...options}
      nav={{
        ...options.nav,
        /*
         * Below `lg` fumadocs collapses the nav's icon links into the hamburger
         * menu. Surface the accounts in the bar itself there; `flex-1` takes the
         * free space so the row sits against the search and menu buttons rather
         * than splitting the gap with their `ms-auto`. From `lg` up the nav's
         * own icon links are shown, so this hides itself.
         */
        children: <SocialLinks className="flex-1 justify-end lg:hidden" />,
      }}
    >
      {children}
    </HomeLayout>
  );
}
