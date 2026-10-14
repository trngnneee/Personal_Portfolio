import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { useTestApp, login, type TestApp } from "./helpers.js";

const getT = useTestApp();

const project = {
  slug: "homelab",
  title: "Homelab",
  summary: "GitOps cluster",
  category: "homelab",
  techStack: ["Kubernetes"],
};

describe("public site", () => {
  let t: TestApp;
  let auth: { Authorization: string };
  const admin = () => request(t.app);

  beforeEach(async () => {
    t = getT();
    auth = { Authorization: `Bearer ${await login(t)}` };
  });

  it("returns enabled sections and their data, with cache headers", async () => {
    await admin().post("/api/v1/admin/projects").set(auth).send(project).expect(201);
    const res = await request(t.app).get("/api/v1/public/site").expect(200);
    expect(res.headers["cache-control"]).toContain("max-age=60");
    expect(res.headers.etag).toBeDefined();
    expect(res.body.sections.map((s: { key: string }) => s.key)).not.toContain("blog");
    expect(res.body.projects).toHaveLength(1);
    expect(res.body.stats.projects).toBe(1);
    expect(res.body.blog).toBeNull();

    const cached = await request(t.app)
      .get("/api/v1/public/site")
      .set("If-None-Match", res.headers.etag!);
    expect(cached.status).toBe(304);
  });

  it("drops data of a disabled section", async () => {
    await admin().post("/api/v1/admin/projects").set(auth).send(project).expect(201);
    await admin()
      .patch("/api/v1/admin/sections/projects")
      .set(auth)
      .send({ enabled: false })
      .expect(200);
    const res = await request(t.app).get("/api/v1/public/site").expect(200);
    expect(res.body.projects).toEqual([]);
    expect(res.body.sections.map((s: { key: string }) => s.key)).not.toContain("projects");
  });

  it("hides unpublished rows and private repo URLs", async () => {
    await admin()
      .post("/api/v1/admin/projects")
      .set(auth)
      .send({ ...project, repoUrl: "https://gitlab.com/x/y", repoVisibility: "private" });
    await admin()
      .post("/api/v1/admin/projects")
      .set(auth)
      .send({ ...project, slug: "hidden", published: false });
    const res = await request(t.app).get("/api/v1/public/site");
    expect(res.body.projects).toHaveLength(1);
    expect(res.body.projects[0].repoUrl).toBeNull();
    expect(res.body.projects[0].repoVisibility).toBe("private");
  });

  it("refuses to disable the hero section", async () => {
    await admin()
      .patch("/api/v1/admin/sections/hero")
      .set(auth)
      .send({ enabled: false })
      .expect(400);
  });

  it("hides the phone unless showPhone is set", async () => {
    const base = {
      fullName: "Dang Truong Nguyen",
      handle: "trngnneee",
      headline: "Backend",
      typewriterLines: ["hi"],
      bio: "",
      location: null,
      email: "me@example.com",
      phone: "0123",
      showPhone: false,
      openToWork: true,
      avatarMediaId: null,
      cvMediaId: null,
    };
    await admin().put("/api/v1/admin/profile").set(auth).send(base).expect(200);
    expect((await request(t.app).get("/api/v1/public/site")).body.profile.phone).toBeNull();
    await admin()
      .put("/api/v1/admin/profile")
      .set(auth)
      .send({ ...base, showPhone: true })
      .expect(200);
    expect((await request(t.app).get("/api/v1/public/site")).body.profile.phone).toBe("0123");
  });
});

describe("public blog", () => {
  let t: TestApp;
  let auth: { Authorization: string };

  beforeEach(async () => {
    t = getT();
    auth = { Authorization: `Bearer ${await login(t)}` };
  });

  const createPost = async (slug: string, publish: boolean) => {
    const res = await request(t.app)
      .post("/api/v1/admin/blog")
      .set(auth)
      .send({ slug, title: slug, content: "```ts\nconst a = 1;\nconst b = 2;\n```", tags: ["k8s"] })
      .expect(201);
    expect(res.body.status).toBe("draft");
    if (publish)
      await request(t.app).post(`/api/v1/admin/blog/${res.body.id}/publish`).set(auth).expect(200);
  };

  it("404s everything while the blog section is disabled", async () => {
    await createPost("hello", true);
    await request(t.app).get("/api/v1/public/blog").expect(404);
    await request(t.app).get("/api/v1/public/blog/hello").expect(404);
    await request(t.app).get("/api/v1/public/blog/rss.xml").expect(404);
  });

  it("serves published posts only once enabled", async () => {
    await request(t.app)
      .patch("/api/v1/admin/sections/blog")
      .set(auth)
      .send({ enabled: true })
      .expect(200);
    await createPost("published-post", true);
    await createPost("draft-post", false);

    const list = await request(t.app).get("/api/v1/public/blog").expect(200);
    expect(list.body.items.map((p: { slug: string }) => p.slug)).toEqual(["published-post"]);
    expect(list.body.tags).toEqual([{ name: "k8s", count: 1 }]);

    const post = await request(t.app).get("/api/v1/public/blog/published-post").expect(200);
    expect(post.body.content).toContain("const b = 2;");
    await request(t.app).get("/api/v1/public/blog/draft-post").expect(404);

    const rss = await request(t.app).get("/api/v1/public/blog/rss.xml").expect(200);
    expect(rss.headers["content-type"]).toContain("application/rss+xml");
    expect(rss.text).toContain("https://trngnneee.io.vn/blog/published-post");
    expect(rss.text).not.toContain("draft-post");

    const site = await request(t.app).get("/api/v1/public/site");
    expect(site.body.blog.latest).toHaveLength(1);

    const sitemap = await request(t.app).get("/sitemap.xml").expect(200);
    expect(sitemap.text).toContain("<loc>https://trngnneee.io.vn/blog/published-post</loc>");
  });

  it("returns 409 on duplicate slug", async () => {
    await createPost("dup", false);
    await request(t.app)
      .post("/api/v1/admin/blog")
      .set(auth)
      .send({ slug: "dup", title: "again" })
      .expect(409);
  });
});

describe("public contact", () => {
  let t: TestApp;
  const valid = {
    name: "Alice",
    email: "alice@example.com",
    subject: "Hello there",
    service: "cloud_devops",
    message: "I would like to talk about a project.",
  };

  beforeEach(() => {
    t = getT();
  });

  const countMessages = async () => {
    const { rows } = await t.ctx.db.$client.query<{ n: string }>(
      "SELECT COUNT(*) AS n FROM contact_messages",
    );
    return { n: Number(rows[0]!.n) };
  };

  it("stores a valid message without exposing it", async () => {
    const res = await request(t.app).post("/api/v1/public/contact").send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });
    expect((await countMessages()).n).toBe(1);
    const { rows } = await t.ctx.db.$client.query<{ ip_hash: string }>(
      "SELECT ip_hash FROM contact_messages",
    );
    const row = rows[0]!;
    expect(row.ip_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("validates input", async () => {
    const res = await request(t.app)
      .post("/api/v1/public/contact")
      .send({ ...valid, email: "nope", message: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
    expect((await countMessages()).n).toBe(0);
  });

  it("silently drops honeypot submissions", async () => {
    const res = await request(t.app)
      .post("/api/v1/public/contact")
      .send({ ...valid, website: "http://spam" });
    expect(res.status).toBe(201);
    expect((await countMessages()).n).toBe(0);
  });

  it("rate limits to 5 per window", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++)
      statuses.push((await request(t.app).post("/api/v1/public/contact").send(valid)).status);
    expect(statuses.slice(0, 5).every((s) => s === 201)).toBe(true);
    expect(statuses[5]).toBe(429);
  });

  it("rate limits per CLIENT_IP_HEADER client, not per proxy hop", async () => {
    const app = createApp({
      ...t.ctx,
      env: { ...t.ctx.env, CLIENT_IP_HEADER: "cf-connecting-ip" },
    });
    const send = (ip: string, hop: string) =>
      request(app)
        .post("/api/v1/public/contact")
        .set("CF-Connecting-IP", ip)
        .set("X-Forwarded-For", hop)
        .send(valid);
    // Same client through rotating proxy egress IPs shares one bucket…
    for (let i = 0; i < 5; i++)
      expect((await send("203.0.113.7", `198.51.100.${i}`)).status).toBe(201);
    expect((await send("203.0.113.7", "198.51.100.99")).status).toBe(429);
    // …while another client is unaffected.
    expect((await send("203.0.113.8", "198.51.100.1")).status).toBe(201);
  });

  it("404s when the contact section is disabled", async () => {
    const auth = { Authorization: `Bearer ${await login(t)}` };
    await request(t.app)
      .patch("/api/v1/admin/sections/contact")
      .set(auth)
      .send({ enabled: false })
      .expect(200);
    await request(t.app).post("/api/v1/public/contact").send(valid).expect(404);
  });

  it("emails the profile owner when a mailer is configured", async () => {
    await t.ctx.db.$client.query(
      "INSERT INTO profile (id, full_name, handle, headline, email, updated_at) VALUES (1, 'N', 'n', 'h', 'owner@example.com', now())",
    );
    await request(t.app).post("/api/v1/public/contact").send(valid).expect(201);
    expect(t.mails).toHaveLength(1);
    expect(t.mails[0]!.to).toBe("owner@example.com");
    expect(t.mails[0]!.replyTo).toBe(valid.email);
  });
});
