// Fixed site sections. Admin can toggle/rename/reorder them but never add or remove keys.
export const SECTION_KEYS = [
  "hero",
  "about",
  "experience",
  "achievements",
  "skills",
  "projects",
  "activities",
  "blog",
  "contact",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

/** Sections that can never be disabled. */
export const LOCKED_SECTIONS: readonly SectionKey[] = ["hero"];

/** Public route each section lives on. `/about` hosts three sections. */
export const SECTION_ROUTES: Record<SectionKey, string> = {
  hero: "/",
  about: "/about",
  experience: "/about",
  achievements: "/about",
  skills: "/skills",
  projects: "/projects",
  activities: "/activities",
  blog: "/blog",
  contact: "/contact",
};

export interface SectionDefault {
  key: SectionKey;
  enabled: boolean;
  navLabel: string;
  heading: string;
  subheading: string;
}

/** Seed defaults, in display order. */
export const SECTION_DEFAULTS: readonly SectionDefault[] = [
  { key: "hero", enabled: true, navLabel: "Home", heading: "whoami", subheading: "" },
  {
    key: "about",
    enabled: true,
    navLabel: "About",
    heading: "About me",
    subheading: "cat about.md",
  },
  {
    key: "experience",
    enabled: true,
    navLabel: "Experience",
    heading: "Work experience",
    subheading: "git log --career",
  },
  {
    key: "achievements",
    enabled: true,
    navLabel: "Achievements",
    heading: "Education & certifications",
    subheading: "ls ~/achievements",
  },
  {
    key: "skills",
    enabled: true,
    navLabel: "Skills",
    heading: "Skills",
    subheading: "ls ~/skills",
  },
  {
    key: "projects",
    enabled: true,
    navLabel: "Projects",
    heading: "Projects",
    subheading: "ls ~/projects",
  },
  {
    key: "activities",
    enabled: true,
    navLabel: "Activities",
    heading: "Activities",
    subheading: "ls ~/activities",
  },
  { key: "blog", enabled: false, navLabel: "Blog", heading: "Blog", subheading: "ls ~/blog" },
  {
    key: "contact",
    enabled: true,
    navLabel: "Contact",
    heading: "Contact",
    subheading: "./contact.sh",
  },
];
