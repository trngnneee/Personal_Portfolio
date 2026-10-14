import { createHash } from "node:crypto";
import {
  blogListQuerySchema,
  contactMessageInputSchema,
  SECTION_ROUTES,
  type BlogList,
  type BlogPost,
} from "@portfolio/shared";
import { Router, type RequestHandler } from "express";
import type { AppContext } from "../../context.js";
import { contactMessages } from "../../db/schema.js";
import { createClientIp } from "../../lib/client-ip.js";
import { notFound } from "../../middleware/error.js";
import { createContactLimiter } from "../../middleware/rate-limit.js";
import { isSectionEnabled, requireSection } from "../../middleware/require-section.js";
import { parseBody, parseQuery } from "../../middleware/validate.js";
import { loadMedia } from "../media/service.js";
import { getProfile } from "../profile/service.js";
import { listSections } from "../sections/service.js";
import { publicMedia, xmlEscape } from "./dto.js";
import { blogCard, buildSitePayload, publishedPosts } from "./site.js";

const BLOG_PAGE_SIZE = 10;

export function createPublicRouter(ctx: AppContext): Router {
  const { db, env, mailer } = ctx;
  const router = Router();
  const clientIp = createClientIp(env.CLIENT_IP_HEADER);
  const blogOn = requireSection(db, "blog");

  router.get("/site", async (_req, res) => {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=600");
    res.json(await buildSitePayload(db));
  });

  router.get("/blog", blogOn, async (req, res) => {
    const { tag, q, page = 1 } = parseQuery(blogListQuerySchema, req);
    const all = await publishedPosts(db);
    const needle = q?.toLowerCase();
    const filtered = all.filter(
      (p) =>
        (!tag || p.tags.includes(tag)) &&
        (!needle ||
          [p.title, p.excerpt ?? "", p.content].some((s) => s.toLowerCase().includes(needle))),
    );
    const items = filtered.slice((page - 1) * BLOG_PAGE_SIZE, page * BLOG_PAGE_SIZE);
    const covers = await loadMedia(
      db,
      items.map((p) => p.coverMediaId),
    );

    const tagCounts = new Map<string, number>();
    for (const p of all) for (const t of p.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);

    res.set("Cache-Control", "public, max-age=60");
    const body: BlogList = {
      items: items.map((p) =>
        blogCard(p, publicMedia(p.coverMediaId == null ? null : covers.get(p.coverMediaId))),
      ),
      page,
      pageSize: BLOG_PAGE_SIZE,
      total: filtered.length,
      tags: [...tagCounts]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    };
    res.json(body);
  });

  // Before "/blog/:slug".
  router.get("/blog/rss.xml", blogOn, async (_req, res) => {
    const profile = await getProfile(db);
    const site = env.PUBLIC_SITE_URL.replace(/\/$/, "");
    const items = (await publishedPosts(db))
      .slice(0, 50)
      .map(
        (p) => `    <item>
      <title>${xmlEscape(p.title)}</title>
      <link>${site}/blog/${p.slug}</link>
      <guid isPermaLink="true">${site}/blog/${p.slug}</guid>
      <pubDate>${(p.publishedAt ?? p.createdAt).toUTCString()}</pubDate>
      <description>${xmlEscape(p.excerpt ?? "")}</description>
${p.tags.map((t) => `      <category>${xmlEscape(t)}</category>`).join("\n")}
    </item>`,
      )
      .join("\n");
    res.type("application/rss+xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape(`${profile?.fullName ?? "Portfolio"} — Blog`)}</title>
    <link>${site}/blog</link>
    <description>${xmlEscape(profile?.headline ?? "Blog")}</description>
    <language>en</language>
${items}
  </channel>
</rss>
`);
  });

  router.get("/blog/:slug", blogOn, async (req, res) => {
    const posts = await publishedPosts(db);
    const index = posts.findIndex((p) => p.slug === req.params.slug);
    const post = posts[index];
    if (!post) throw notFound();
    const cover = publicMedia(
      (await loadMedia(db, [post.coverMediaId])).get(post.coverMediaId ?? -1),
    );
    // posts are newest-first: "newer" is index - 1.
    const link = (p: (typeof posts)[number] | undefined) =>
      p ? { slug: p.slug, title: p.title } : null;
    res.set("Cache-Control", "public, max-age=60");
    const body: BlogPost = {
      ...blogCard(post, cover),
      content: post.content,
      updatedAt: post.updatedAt.toISOString(),
      newer: link(posts[index - 1]),
      older: link(posts[index + 1]),
    };
    res.json(body);
  });

  router.post(
    "/contact",
    requireSection(db, "contact"),
    createContactLimiter(clientIp),
    async (req, res) => {
      const input = parseBody(contactMessageInputSchema, req);
      // Honeypot filled → pretend success, store nothing.
      if (input.website) {
        res.status(201).json({ ok: true });
        return;
      }
      const ipHash = createHash("sha256")
        .update(`${env.IP_HASH_SALT}:${clientIp(req)}`)
        .digest("hex");
      await db.insert(contactMessages).values({
        name: input.name,
        email: input.email,
        subject: input.subject,
        service: input.service,
        message: input.message,
        ipHash,
        userAgent: req.get("user-agent")?.slice(0, 300) ?? null,
      });

      const owner = (await getProfile(db))?.email;
      if (owner) {
        void mailer.send({
          to: owner,
          replyTo: input.email,
          subject: `[Portfolio] ${input.subject}`,
          text: `From: ${input.name} <${input.email}>\nService: ${input.service}\n\n${input.message}`,
        });
      }
      res.status(201).json({ ok: true });
    },
  );

  return router;
}

/** GET /sitemap.xml (root, proxied by the static site). */
export function sitemapHandler({ db, env }: AppContext): RequestHandler {
  return async (_req, res) => {
    const site = env.PUBLIC_SITE_URL.replace(/\/$/, "");
    const routes = new Set(
      (await listSections(db)).filter((s) => s.enabled).map((s) => SECTION_ROUTES[s.key]),
    );
    const urls = [...routes].map((r) => `  <url><loc>${site}${r === "/" ? "/" : r}</loc></url>`);
    if (await isSectionEnabled(db, "blog")) {
      for (const p of await publishedPosts(db)) {
        urls.push(
          `  <url><loc>${site}/blog/${p.slug}</loc><lastmod>${p.updatedAt.toISOString().slice(0, 10)}</lastmod></url>`,
        );
      }
    }
    res.set("Cache-Control", "public, max-age=3600");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`);
  };
}
