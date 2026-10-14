import { count, desc, eq, sql, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { Router } from "express";
import type { AppContext } from "../../context.js";
import * as schema from "../../db/schema.js";
import { listSections } from "../sections/service.js";

const {
  achievements,
  activities,
  blogPosts,
  contactMessages,
  experiences,
  media,
  projects,
  skills,
  socialLinks,
} = schema;

export function registerSystem({ db }: AppContext, router: Router): void {
  const countOf = async (table: PgTable, where?: SQL) => {
    const [row] = await db.select({ n: count() }).from(table).where(where);
    return row?.n ?? 0;
  };

  router.get("/dashboard", async (_req, res) => {
    const [counts, sections, latestMessages, drafts, perDay] = await Promise.all([
      Promise.all([
        countOf(projects),
        countOf(skills),
        countOf(experiences),
        countOf(achievements),
        countOf(activities),
        countOf(socialLinks),
        countOf(media),
        countOf(blogPosts),
        countOf(blogPosts, eq(blogPosts.status, "draft")),
        countOf(contactMessages, eq(contactMessages.status, "new")),
      ]),
      listSections(db),
      db
        .select({
          id: contactMessages.id,
          name: contactMessages.name,
          subject: contactMessages.subject,
          status: contactMessages.status,
          createdAt: contactMessages.createdAt,
        })
        .from(contactMessages)
        .orderBy(desc(contactMessages.id))
        .limit(5),
      db
        .select({ id: blogPosts.id, title: blogPosts.title, updatedAt: blogPosts.updatedAt })
        .from(blogPosts)
        .where(eq(blogPosts.status, "draft"))
        .orderBy(desc(blogPosts.updatedAt))
        .limit(5),
      // Contact messages per day for the last 14 days (UTC), zero-filled.
      db.execute<{ day: string; n: string }>(sql`
        SELECT to_char(d.day, 'YYYY-MM-DD') AS day, COUNT(m.id) AS n
        FROM generate_series(
          date_trunc('day', now() AT TIME ZONE 'UTC') - interval '13 days',
          date_trunc('day', now() AT TIME ZONE 'UTC'),
          interval '1 day'
        ) AS d(day)
        LEFT JOIN contact_messages m
          ON date_trunc('day', m.created_at AT TIME ZONE 'UTC') = d.day
        GROUP BY d.day ORDER BY d.day`),
    ]);
    const [p, s, e, a, act, links, m, posts, postDrafts, messagesNew] = counts;

    res.json({
      counts: {
        projects: p,
        skills: s,
        experiences: e,
        achievements: a,
        activities: act,
        socialLinks: links,
        media: m,
        blogPosts: posts,
        blogDrafts: postDrafts,
        messagesNew,
      },
      disabledSections: sections.filter((x) => !x.enabled).map((x) => x.key),
      latestMessages,
      drafts,
      messagesPerDay: perDay.rows.map((r) => ({ day: r.day, count: Number(r.n) })),
    });
  });

  // Full content dump for backups. admin_account is deliberately excluded.
  router.get("/export", async (_req, res) => {
    const { adminAccount: _excluded, ...tables } = schema;
    const dump: Record<string, unknown[]> = {};
    for (const [name, table] of Object.entries(tables)) {
      dump[name] = await db.select().from(table as PgTable);
    }
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Disposition", `attachment; filename="portfolio-export-${date}.json"`);
    res.json({ exportedAt: new Date().toISOString(), tables: dump });
  });
}
