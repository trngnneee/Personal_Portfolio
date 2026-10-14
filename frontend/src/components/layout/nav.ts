import type { PublicSection } from "@portfolio/shared";

export interface NavItem {
  label: string;
  to: string;
}

/** One nav item per route, in section order; /about hosts 3 sections and takes the first enabled label. */
export function buildNav(sections: PublicSection[]): NavItem[] {
  const seen = new Set<string>();
  const items: NavItem[] = [];
  for (const s of sections) {
    if (seen.has(s.route)) continue;
    seen.add(s.route);
    items.push({ label: s.navLabel, to: s.route });
  }
  return items;
}

export const isActive = (pathname: string, to: string) =>
  to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
