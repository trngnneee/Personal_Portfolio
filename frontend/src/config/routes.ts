import type { SectionKey } from "@portfolio/shared";

export const ROUTES = {
  home: "/",
  about: "/about",
  skills: "/skills",
  projects: "/projects",
  activities: "/activities",
  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}`,
  contact: "/contact",
} as const;

/** A route is reachable when at least one of its sections is enabled. */
export const ROUTE_SECTIONS: Record<string, SectionKey[]> = {
  [ROUTES.home]: ["hero"],
  [ROUTES.about]: ["about", "experience", "achievements"],
  [ROUTES.skills]: ["skills"],
  [ROUTES.projects]: ["projects"],
  [ROUTES.activities]: ["activities"],
  [ROUTES.blog]: ["blog"],
  [ROUTES.contact]: ["contact"],
};

export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "");
