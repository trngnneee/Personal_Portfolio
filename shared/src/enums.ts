// Closed value sets shared by DB, API and both frontends.
export const SOCIAL_PLATFORMS = [
  "github",
  "gitlab",
  "linkedin",
  "facebook",
  "instagram",
  "x",
  "email",
  "other",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SKILL_CATEGORIES = [
  "languages",
  "frontend",
  "backend",
  "database",
  "cloud_devops",
  "infrastructure",
  "other",
] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const PROJECT_CATEGORIES = [
  "homelab",
  "cloud",
  "bot",
  "iot",
  "fullstack",
  "ai",
  "game",
  "other",
] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const REPO_VISIBILITIES = ["public", "private"] as const;
export type RepoVisibility = (typeof REPO_VISIBILITIES)[number];

export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "internship",
  "freelance",
  "contract",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const ACHIEVEMENT_TYPES = ["education", "certification", "award"] as const;
export type AchievementType = (typeof ACHIEVEMENT_TYPES)[number];

export const BLOG_STATUSES = ["draft", "published"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export const MESSAGE_STATUSES = ["new", "read", "archived"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const CONTACT_SERVICES = [
  "frontend_development",
  "backend_development",
  "cloud_devops",
  "consulting",
  "other",
] as const;
export type ContactService = (typeof CONTACT_SERVICES)[number];

export const MEDIA_RESOURCE_TYPES = ["image", "raw"] as const;
export type MediaResourceType = (typeof MEDIA_RESOURCE_TYPES)[number];
