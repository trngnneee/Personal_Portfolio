import {
  SECTION_DEFAULTS,
  SECTION_ROUTES,
  type PublicSite,
  type SectionKey,
} from "@portfolio/shared";

export function site(disabled: SectionKey[] = ["blog"]): PublicSite {
  return {
    sections: SECTION_DEFAULTS.filter((s) => !disabled.includes(s.key)).map((s) => ({
      key: s.key,
      navLabel: s.navLabel,
      heading: s.heading,
      subheading: s.subheading,
      route: SECTION_ROUTES[s.key],
    })),
    profile: {
      fullName: "Dang Truong Nguyen",
      handle: "trngnneee",
      headline: "Backend · Cloud · DevOps Engineer",
      typewriterLines: ["Hello"],
      bio: "Bio",
      location: "HCMC",
      email: "me@example.com",
      phone: null,
      openToWork: false,
      avatar: null,
      cv: null,
    },
    socialLinks: [{ platform: "github", label: "GitHub", url: "https://github.com/trngnneee" }],
    skills: [
      { name: "Go", category: "languages", iconUrl: null, level: null },
      { name: "Kubernetes", category: "cloud_devops", iconUrl: null, level: 80 },
    ],
    projects: [],
    experiences: [],
    achievements: [],
    activities: [],
    blog: null,
    stats: { projects: 0, technologies: 2, certifications: 0, awards: 0 },
  };
}
