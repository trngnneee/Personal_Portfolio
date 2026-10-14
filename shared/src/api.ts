// Public API response shapes. The backend's DTO builders are typed against these,
// so a field change breaks the build on both ends. Dates are ISO strings.
import type {
  AchievementType,
  EmploymentType,
  ProjectCategory,
  RepoVisibility,
  SkillCategory,
  SocialPlatform,
} from "./enums.js";
import type { SectionKey } from "./sections.js";

export interface PublicMedia {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  format: string | null;
}

export interface PublicSection {
  key: SectionKey;
  navLabel: string;
  heading: string;
  subheading: string;
  route: string;
}

export interface PublicProfile {
  fullName: string;
  handle: string;
  headline: string;
  typewriterLines: string[];
  bio: string;
  location: string | null;
  email: string;
  phone: string | null;
  openToWork: boolean;
  avatar: PublicMedia | null;
  cv: PublicMedia | null;
}

export interface PublicSocialLink {
  platform: SocialPlatform;
  label: string;
  url: string;
}

export interface PublicSkill {
  name: string;
  category: SkillCategory;
  iconUrl: string | null;
  level: number | null;
}

export interface PublicProject {
  slug: string;
  title: string;
  subtitle: string | null;
  summary: string;
  description: string;
  highlights: string[];
  role: string | null;
  category: ProjectCategory;
  techStack: string[];
  repoUrl: string | null;
  repoVisibility: RepoVisibility;
  demoUrl: string | null;
  cover: PublicMedia | null;
  featured: boolean;
  startDate: string | null;
  endDate: string | null;
}

export interface PublicExperience {
  company: string;
  companyUrl: string | null;
  logo: PublicMedia | null;
  position: string;
  employmentType: EmploymentType;
  location: string | null;
  startDate: string;
  endDate: string | null;
  description: string;
  highlights: string[];
  techStack: string[];
}

export interface PublicAchievement {
  type: AchievementType;
  title: string;
  issuer: string | null;
  periodLabel: string | null;
  date: string | null;
  description: string | null;
  accentColor: string | null;
  credentialUrl: string | null;
  media: PublicMedia | null;
}

export interface PublicActivity {
  title: string;
  organization: string | null;
  location: string | null;
  role: string | null;
  description: string | null;
  periodLabel: string | null;
  date: string | null;
  images: PublicMedia[];
}

export interface BlogCard {
  slug: string;
  title: string;
  excerpt: string | null;
  tags: string[];
  cover: PublicMedia | null;
  publishedAt: string | null;
  readingMinutes: number;
  featured: boolean;
}

export interface PublicSite {
  sections: PublicSection[];
  profile: PublicProfile | null;
  socialLinks: PublicSocialLink[];
  skills: PublicSkill[];
  projects: PublicProject[];
  experiences: PublicExperience[];
  achievements: PublicAchievement[];
  activities: PublicActivity[];
  blog: { latest: BlogCard[] } | null;
  stats: { projects: number; technologies: number; certifications: number; awards: number };
}

export interface BlogList {
  items: BlogCard[];
  page: number;
  pageSize: number;
  total: number;
  tags: { name: string; count: number }[];
}

export interface BlogPost extends BlogCard {
  content: string;
  updatedAt: string;
  newer: { slug: string; title: string } | null;
  older: { slug: string; title: string } | null;
}
