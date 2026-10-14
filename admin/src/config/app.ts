export const APP_CONFIG = {
  name: "Portfolio Admin",
  version: "1.0.0",
  publicSiteUrl: (import.meta.env.VITE_PUBLIC_SITE_URL ?? "").replace(/\/$/, ""),
} as const;

/** Single source of truth for every route path. */
export const ROUTES = {
  root: "/",
  login: "/login",
  serverError: "/500",
  dashboard: "/dashboard",
  sections: "/sections",
  profile: "/profile",
  socialLinks: "/social-links",
  projects: "/projects",
  experiences: "/experiences",
  achievements: "/achievements",
  activities: "/activities",
  skills: "/skills",
  blog: "/blog",
  blogNew: "/blog/new",
  blogEdit: "/blog/:id",
  media: "/media",
  messages: "/messages",
  settings: "/settings",
} as const;

export const blogEditPath = (id: number) => ROUTES.blogEdit.replace(":id", String(id));
export const publicUrl = (path: string) => `${APP_CONFIG.publicSiteUrl}${path}`;
