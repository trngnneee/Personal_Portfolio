import { z } from "zod";
import {
  ACHIEVEMENT_TYPES,
  BLOG_STATUSES,
  EMPLOYMENT_TYPES,
  MESSAGE_STATUSES,
  PROJECT_CATEGORIES,
  REPO_VISIBILITIES,
  SKILL_CATEGORIES,
  SOCIAL_PLATFORMS,
} from "../enums.js";
import { SECTION_KEYS } from "../sections.js";
import { hexColor, mediaId, optDate, optText, optUrl, slugSchema, stringList } from "./common.js";

// Create schemas list every field; update schemas are `.partial()`.
// No `.default()` here: defaults are applied by the backend on create only.

export const sectionPatchSchema = z
  .object({
    enabled: z.boolean(),
    navLabel: z.string().trim().min(1).max(40),
    heading: z.string().trim().min(1).max(120),
    subheading: z.string().trim().max(200),
  })
  .partial();
export type SectionPatchInput = z.infer<typeof sectionPatchSchema>;

export const sectionReorderSchema = z.object({
  keys: z.array(z.enum(SECTION_KEYS)).length(SECTION_KEYS.length),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  handle: z.string().trim().min(1).max(40),
  headline: z.string().trim().min(1).max(160),
  typewriterLines: stringList(10, 120),
  bio: z.string().trim().max(10_000),
  location: optText(120),
  email: z.email().trim().max(254),
  phone: optText(40),
  showPhone: z.boolean(),
  openToWork: z.boolean(),
  avatarMediaId: mediaId,
  cvMediaId: mediaId,
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  label: z.string().trim().min(1).max(60),
  url: z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .refine((v) => /^(https?:|mailto:)/.test(v), "Must be http(s) or mailto"),
  visible: z.boolean().optional(),
});
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;

export const skillSchema = z.object({
  name: z.string().trim().min(1).max(60),
  category: z.enum(SKILL_CATEGORIES),
  iconUrl: optUrl.optional(),
  level: z.number().int().min(0).max(100).nullable().optional(),
  published: z.boolean().optional(),
});
export type SkillInput = z.infer<typeof skillSchema>;

export const projectSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(160),
  subtitle: optText(200).optional(),
  summary: z.string().trim().min(1).max(600),
  description: z.string().max(50_000).optional(),
  highlights: stringList(12, 300).optional(),
  role: optText(120).optional(),
  category: z.enum(PROJECT_CATEGORIES),
  techStack: stringList(40, 60).optional(),
  repoUrl: optUrl.optional(),
  repoVisibility: z.enum(REPO_VISIBILITIES).optional(),
  demoUrl: optUrl.optional(),
  coverMediaId: mediaId.optional(),
  featured: z.boolean().optional(),
  startDate: optDate.optional(),
  endDate: optDate.optional(),
  published: z.boolean().optional(),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const experienceSchema = z.object({
  company: z.string().trim().min(1).max(120),
  companyUrl: optUrl.optional(),
  logoMediaId: mediaId.optional(),
  position: z.string().trim().min(1).max(120),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  location: optText(120).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/),
  endDate: optDate.optional(),
  description: z.string().max(20_000).optional(),
  highlights: stringList(12, 300).optional(),
  techStack: stringList(40, 60).optional(),
  published: z.boolean().optional(),
});
export type ExperienceInput = z.infer<typeof experienceSchema>;

export const achievementSchema = z.object({
  type: z.enum(ACHIEVEMENT_TYPES),
  title: z.string().trim().min(1).max(200),
  issuer: optText(160).optional(),
  periodLabel: optText(40).optional(),
  date: optDate.optional(),
  description: optText(2000).optional(),
  accentColor: hexColor.nullable().optional(),
  credentialUrl: optUrl.optional(),
  mediaId: mediaId.optional(),
  published: z.boolean().optional(),
});
export type AchievementInput = z.infer<typeof achievementSchema>;

export const activitySchema = z.object({
  title: z.string().trim().min(1).max(200),
  organization: optText(160).optional(),
  location: optText(160).optional(),
  role: optText(120).optional(),
  description: optText(4000).optional(),
  periodLabel: optText(40).optional(),
  date: optDate.optional(),
  published: z.boolean().optional(),
});
export type ActivityInput = z.infer<typeof activitySchema>;

export const activityImageAttachSchema = z.object({ mediaId: z.number().int().positive() });

export const blogPostSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  excerpt: optText(500).optional(),
  content: z.string().max(200_000).optional(),
  coverMediaId: mediaId.optional(),
  tags: stringList(12, 40).optional(),
  featured: z.boolean().optional(),
});
export type BlogPostInput = z.infer<typeof blogPostSchema>;

export const blogListQuerySchema = z.object({
  tag: z.string().trim().max(40).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
});

export const mediaPatchSchema = z.object({ alt: z.string().trim().max(300) });

export const mediaListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).optional(),
  q: z.string().trim().max(100).optional(),
  folder: z.string().trim().max(100).optional(),
});

export const messagePatchSchema = z.object({ status: z.enum(MESSAGE_STATUSES) });
export const messageListQuerySchema = z.object({ status: z.enum(MESSAGE_STATUSES).optional() });

export const blogStatusSchema = z.enum(BLOG_STATUSES);
