import {
  SECTION_ROUTES,
  type BlogCard,
  type PublicMedia,
  type PublicSite,
  type SectionKey,
} from "@portfolio/shared";
import { asc, desc, eq, inArray } from "drizzle-orm";
import type { Executor } from "../../db/client.js";
import {
  achievements,
  activities,
  activityImages,
  blogPosts,
  experiences,
  projects,
  skills,
  socialLinks,
} from "../../db/schema.js";
import { loadMedia } from "../media/service.js";
import { getProfile } from "../profile/service.js";
import { listSections } from "../sections/service.js";
import { publicMedia } from "./dto.js";

type PostRow = typeof blogPosts.$inferSelect;

export function blogCard(row: PostRow, cover: PublicMedia | null): BlogCard {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    tags: row.tags,
    cover,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    readingMinutes: row.readingMinutes,
    featured: row.featured,
  };
}

const none = Promise.resolve([] as never[]);

/** Everything the public site needs in one call. Disabled sections contribute no data. */
export async function buildSitePayload(db: Executor): Promise<PublicSite> {
  const sections = (await listSections(db)).filter((s) => s.enabled);
  const on = new Set<SectionKey>(sections.map((s) => s.key));

  const [
    p,
    links,
    projectRows,
    skillRows,
    experienceRows,
    achievementRows,
    activityRows,
    latestPosts,
  ] = await Promise.all([
    getProfile(db),
    db
      .select({ platform: socialLinks.platform, label: socialLinks.label, url: socialLinks.url })
      .from(socialLinks)
      .where(eq(socialLinks.visible, true))
      .orderBy(asc(socialLinks.sortOrder)),
    on.has("projects")
      ? db
          .select()
          .from(projects)
          .where(eq(projects.published, true))
          .orderBy(asc(projects.sortOrder))
      : none,
    on.has("skills")
      ? db.select().from(skills).where(eq(skills.published, true)).orderBy(asc(skills.sortOrder))
      : none,
    on.has("experience")
      ? db
          .select()
          .from(experiences)
          .where(eq(experiences.published, true))
          .orderBy(asc(experiences.sortOrder))
      : none,
    on.has("achievements")
      ? db
          .select()
          .from(achievements)
          .where(eq(achievements.published, true))
          .orderBy(asc(achievements.sortOrder))
      : none,
    on.has("activities")
      ? db
          .select()
          .from(activities)
          .where(eq(activities.published, true))
          .orderBy(asc(activities.sortOrder))
      : none,
    on.has("blog")
      ? db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.status, "published"))
          .orderBy(desc(blogPosts.publishedAt))
          .limit(3)
      : none,
  ]);

  const imageRows = activityRows.length
    ? await db
        .select()
        .from(activityImages)
        .where(
          inArray(
            activityImages.activityId,
            activityRows.map((a) => a.id),
          ),
        )
        .orderBy(asc(activityImages.sortOrder))
    : [];

  const mediaById = await loadMedia(db, [
    p?.avatarMediaId,
    p?.cvMediaId,
    ...projectRows.map((r) => r.coverMediaId),
    ...experienceRows.map((r) => r.logoMediaId),
    ...achievementRows.map((r) => r.mediaId),
    ...imageRows.map((r) => r.mediaId),
    ...latestPosts.map((r) => r.coverMediaId),
  ]);
  const m = (id: number | null | undefined) => publicMedia(id == null ? null : mediaById.get(id));

  const technologies = new Set([
    ...projectRows.flatMap((r) => r.techStack),
    ...skillRows.map((s) => s.name),
  ]);

  return {
    sections: sections.map((s) => ({
      key: s.key,
      navLabel: s.navLabel,
      heading: s.heading,
      subheading: s.subheading,
      route: SECTION_ROUTES[s.key],
    })),
    profile: p
      ? {
          fullName: p.fullName,
          handle: p.handle,
          headline: p.headline,
          typewriterLines: p.typewriterLines,
          bio: p.bio,
          location: p.location,
          email: p.email,
          phone: p.showPhone ? p.phone : null,
          openToWork: p.openToWork,
          avatar: m(p.avatarMediaId),
          cv: m(p.cvMediaId),
        }
      : null,
    socialLinks: links,
    skills: skillRows.map((s) => ({
      name: s.name,
      category: s.category,
      iconUrl: s.iconUrl,
      level: s.level,
    })),
    projects: projectRows.map((r) => ({
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle,
      summary: r.summary,
      description: r.description,
      highlights: r.highlights,
      role: r.role,
      category: r.category,
      techStack: r.techStack,
      // Private repos: expose the fact, never the URL.
      repoUrl: r.repoVisibility === "public" ? r.repoUrl : null,
      repoVisibility: r.repoVisibility,
      demoUrl: r.demoUrl,
      cover: m(r.coverMediaId),
      featured: r.featured,
      startDate: r.startDate,
      endDate: r.endDate,
    })),
    experiences: experienceRows.map((r) => ({
      company: r.company,
      companyUrl: r.companyUrl,
      logo: m(r.logoMediaId),
      position: r.position,
      employmentType: r.employmentType,
      location: r.location,
      startDate: r.startDate,
      endDate: r.endDate,
      description: r.description,
      highlights: r.highlights,
      techStack: r.techStack,
    })),
    achievements: achievementRows.map((r) => ({
      type: r.type,
      title: r.title,
      issuer: r.issuer,
      periodLabel: r.periodLabel,
      date: r.date,
      description: r.description,
      accentColor: r.accentColor,
      credentialUrl: r.credentialUrl,
      media: m(r.mediaId),
    })),
    activities: activityRows.map((r) => ({
      title: r.title,
      organization: r.organization,
      location: r.location,
      role: r.role,
      description: r.description,
      periodLabel: r.periodLabel,
      date: r.date,
      images: imageRows.filter((i) => i.activityId === r.id).flatMap((i) => m(i.mediaId) ?? []),
    })),
    blog: on.has("blog")
      ? { latest: latestPosts.map((r) => blogCard(r, m(r.coverMediaId))) }
      : null,
    stats: {
      projects: projectRows.length,
      technologies: technologies.size,
      certifications: achievementRows.filter((a) => a.type === "certification").length,
      awards: achievementRows.filter((a) => a.type === "award").length,
    },
  };
}

export function publishedPosts(db: Executor): Promise<PostRow[]> {
  return db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.id));
}
