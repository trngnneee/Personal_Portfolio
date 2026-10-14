import {
  ACHIEVEMENT_TYPES,
  BLOG_STATUSES,
  CONTACT_SERVICES,
  EMPLOYMENT_TYPES,
  MEDIA_RESOURCE_TYPES,
  MESSAGE_STATUSES,
  PROJECT_CATEGORIES,
  REPO_VISIBILITIES,
  SECTION_KEYS,
  SKILL_CATEGORIES,
  SOCIAL_PLATFORMS,
} from "@portfolio/shared";
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const id = () => integer("id").primaryKey().generatedAlwaysAsIdentity();
const tstz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const createdAt = () => tstz("created_at").notNull().defaultNow();
const updatedAt = () =>
  tstz("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date());
const timestamps = { createdAt: createdAt(), updatedAt: updatedAt() };
const sortOrder = () => integer("sort_order").notNull().default(0);
const published = () => boolean("published").notNull().default(true);
const jsonList = (name: string) =>
  jsonb(name)
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`);
const mediaRef = (name: string) => integer(name).references(() => media.id);

/** Singleton row (id = 1). */
export const adminAccount = pgTable("admin_account", {
  id: integer("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  tokenVersion: integer("token_version").notNull().default(1),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: tstz("locked_until"),
  lastLoginAt: tstz("last_login_at"),
  passwordChangedAt: tstz("password_changed_at"),
});

export const siteSections = pgTable("site_sections", {
  key: text("key", { enum: SECTION_KEYS }).primaryKey(),
  enabled: boolean("enabled").notNull(),
  navLabel: text("nav_label").notNull(),
  heading: text("heading").notNull(),
  subheading: text("subheading").notNull().default(""),
  sortOrder: sortOrder(),
  updatedAt: updatedAt(),
});

export const media = pgTable("media", {
  id: id(),
  publicId: text("public_id"),
  url: text("url").notNull(),
  resourceType: text("resource_type", { enum: MEDIA_RESOURCE_TYPES }).notNull(),
  format: text("format"),
  width: integer("width"),
  height: integer("height"),
  bytes: integer("bytes"),
  alt: text("alt").notNull().default(""),
  folder: text("folder").notNull().default(""),
  ...timestamps,
});

/** Singleton row (id = 1). */
export const profile = pgTable("profile", {
  id: integer("id").primaryKey(),
  fullName: text("full_name").notNull(),
  handle: text("handle").notNull(),
  headline: text("headline").notNull(),
  typewriterLines: jsonList("typewriter_lines"),
  bio: text("bio").notNull().default(""),
  location: text("location"),
  email: text("email").notNull(),
  phone: text("phone"),
  showPhone: boolean("show_phone").notNull().default(false),
  openToWork: boolean("open_to_work").notNull().default(false),
  avatarMediaId: mediaRef("avatar_media_id"),
  cvMediaId: mediaRef("cv_media_id"),
  updatedAt: updatedAt(),
});

export const socialLinks = pgTable("social_links", {
  id: id(),
  platform: text("platform", { enum: SOCIAL_PLATFORMS }).notNull(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  sortOrder: sortOrder(),
  visible: boolean("visible").notNull().default(true),
  ...timestamps,
});

export const skills = pgTable("skills", {
  id: id(),
  name: text("name").notNull(),
  category: text("category", { enum: SKILL_CATEGORIES }).notNull(),
  iconUrl: text("icon_url"),
  level: integer("level"),
  sortOrder: sortOrder(),
  published: published(),
  ...timestamps,
});

export const projects = pgTable("projects", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  summary: text("summary").notNull(),
  description: text("description").notNull().default(""),
  highlights: jsonList("highlights"),
  role: text("role"),
  category: text("category", { enum: PROJECT_CATEGORIES }).notNull(),
  techStack: jsonList("tech_stack"),
  repoUrl: text("repo_url"),
  repoVisibility: text("repo_visibility", { enum: REPO_VISIBILITIES }).notNull().default("public"),
  demoUrl: text("demo_url"),
  coverMediaId: mediaRef("cover_media_id"),
  featured: boolean("featured").notNull().default(false),
  startDate: text("start_date"),
  endDate: text("end_date"),
  sortOrder: sortOrder(),
  published: published(),
  ...timestamps,
});

export const experiences = pgTable("experiences", {
  id: id(),
  company: text("company").notNull(),
  companyUrl: text("company_url"),
  logoMediaId: mediaRef("logo_media_id"),
  position: text("position").notNull(),
  employmentType: text("employment_type", { enum: EMPLOYMENT_TYPES }).notNull(),
  location: text("location"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  description: text("description").notNull().default(""),
  highlights: jsonList("highlights"),
  techStack: jsonList("tech_stack"),
  sortOrder: sortOrder(),
  published: published(),
  ...timestamps,
});

export const achievements = pgTable("achievements", {
  id: id(),
  type: text("type", { enum: ACHIEVEMENT_TYPES }).notNull(),
  title: text("title").notNull(),
  issuer: text("issuer"),
  periodLabel: text("period_label"),
  date: text("date"),
  description: text("description"),
  accentColor: text("accent_color"),
  credentialUrl: text("credential_url"),
  mediaId: mediaRef("media_id"),
  sortOrder: sortOrder(),
  published: published(),
  ...timestamps,
});

export const activities = pgTable("activities", {
  id: id(),
  title: text("title").notNull(),
  organization: text("organization"),
  location: text("location"),
  role: text("role"),
  description: text("description"),
  periodLabel: text("period_label"),
  date: text("date"),
  sortOrder: sortOrder(),
  published: published(),
  ...timestamps,
});

export const activityImages = pgTable(
  "activity_images",
  {
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id),
    sortOrder: sortOrder(),
  },
  (t) => [
    primaryKey({ columns: [t.activityId, t.mediaId] }),
    index("activity_images_media_idx").on(t.mediaId),
  ],
);

export const blogPosts = pgTable("blog_posts", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull().default(""),
  coverMediaId: mediaRef("cover_media_id"),
  tags: jsonList("tags"),
  status: text("status", { enum: BLOG_STATUSES }).notNull().default("draft"),
  publishedAt: tstz("published_at"),
  readingMinutes: integer("reading_minutes").notNull().default(1),
  featured: boolean("featured").notNull().default(false),
  ...timestamps,
});

/** Media embedded in a post's markdown, re-derived on every save. */
export const blogPostMedia = pgTable(
  "blog_post_media",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.mediaId] }),
    index("blog_post_media_media_idx").on(t.mediaId),
  ],
);

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: id(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    subject: text("subject").notNull(),
    service: text("service", { enum: CONTACT_SERVICES }).notNull(),
    message: text("message").notNull(),
    status: text("status", { enum: MESSAGE_STATUSES }).notNull().default("new"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (t) => [index("contact_messages_status_idx").on(t.status)],
);
