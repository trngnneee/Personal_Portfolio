/**
 * Security regression tests: injection, traversal, auth bypass, mass assignment,
 * prototype pollution, malicious uploads, output escaping, headers, DoS limits.
 */
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express from "express";
import { SignJWT } from "jose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createJwt } from "../src/lib/jwt.js";
import { createLocalStorage } from "../src/lib/storage.js";
import { errorHandler } from "../src/middleware/error.js";
import { escapeLike } from "../src/modules/media/admin.router.js";
import { login, PNG_BYTES, useTestApp, type TestApp } from "./helpers.js";

const getT = useTestApp();
let t: TestApp;
let auth: { Authorization: string };
const api = (path: string) => `/api/v1/admin${path}`;

beforeEach(async () => {
  t = getT();
  auth = { Authorization: `Bearer ${await login(t)}` };
});

const tableExists = async (name: string) => {
  const { rows } = await t.ctx.db.$client.query<{ ok: boolean }>(
    "SELECT to_regclass($1) IS NOT NULL AS ok",
    [`public.${name}`],
  );
  return rows[0]!.ok;
};

const upload = (
  buf: Buffer,
  filename: string,
  contentType: string,
  fields: Record<string, string> = {},
) => {
  let req = request(t.app).post(api("/media")).set(auth);
  for (const [k, v] of Object.entries(fields)) req = req.field(k, v);
  return req.attach("file", buf, { filename, contentType });
};

const SQLI = [
  "' OR '1'='1",
  "'; DROP TABLE projects; --",
  "1; DELETE FROM skills",
  '" OR ""="',
  "' UNION SELECT password_hash FROM admin_account --",
];

describe("SQL injection", () => {
  it("public blog search/tag treat payloads as data", async () => {
    await request(t.app).patch(api("/sections/blog")).set(auth).send({ enabled: true });
    for (const payload of SQLI) {
      const res = await request(t.app)
        .get("/api/v1/public/blog")
        .query({ q: payload, tag: payload.slice(0, 40) });
      expect(res.status, payload).toBe(200);
      expect(res.body.items).toEqual([]);
      // Over-long input is rejected by validation before any query runs.
      const long = await request(t.app)
        .get("/api/v1/public/blog")
        .query({ tag: `${payload}${"x".repeat(41)}` });
      expect(long.status).toBe(400);
      expect(JSON.stringify(res.body)).not.toContain("argon2");
    }
    expect(await tableExists("projects")).toBe(true);
  });

  it("rejects injected path params instead of interpolating them", async () => {
    for (const id of ["1 OR 1=1", "1;DROP TABLE skills", "1'--", "-1", "0x1", "1e3"]) {
      const res = await request(t.app)
        .get(api(`/skills/${encodeURIComponent(id)}`))
        .set(auth);
      expect(res.status, id).toBe(400);
    }
    await request(t.app)
      .patch(api(`/sections/${encodeURIComponent("hero' --")}`))
      .set(auth)
      .send({})
      .expect(400);
    await request(t.app)
      .get(api("/messages"))
      .query({ status: "new' OR 1=1 --" })
      .set(auth)
      .expect(400);
    expect(await tableExists("skills")).toBe(true);
  });

  it("login with injection payloads never authenticates", async () => {
    for (const payload of SQLI) {
      const res = await request(t.app)
        .post(api("/auth/login"))
        .send({ email: `admin@test.local${payload}`, password: payload });
      expect([400, 401]).toContain(res.status);
      expect(res.body.token).toBeUndefined();
    }
  });

  it("stores injection payloads verbatim (parameterized)", async () => {
    const payload = "'); DROP TABLE contact_messages; --";
    await request(t.app)
      .post("/api/v1/public/contact")
      .send({
        name: "Mallory",
        email: "m@example.com",
        subject: payload,
        service: "other",
        message: payload,
      })
      .expect(201);
    const list = await request(t.app).get(api("/messages")).set(auth).expect(200);
    expect(list.body.items[0].subject).toBe(payload);
    expect(await tableExists("contact_messages")).toBe(true);
  });

  it("escapes LIKE wildcards in media search", async () => {
    await upload(PNG_BYTES, "a.png", "image/png", { alt: "sunset" }).expect(201);
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
    for (const [q, expected] of [
      ["%", 0],
      ["_", 0],
      ["suns", 1],
      ["SUNSET", 1],
    ] as const) {
      const res = await request(t.app).get(api("/media")).query({ q }).set(auth).expect(200);
      expect(res.body.total, `q=${q}`).toBe(expected);
    }
  });
});

describe("path traversal", () => {
  const probes = [
    "/seed-assets/../package.json",
    "/seed-assets/..%2fpackage.json",
    "/seed-assets/%2e%2e/%2e%2e/.env",
    "/seed-assets/..%5c..%5cpackage.json",
    "/seed-assets/%252e%252e%252fpackage.json",
    "/seed-assets/....//....//package.json",
    "/uploads/../../.env",
    "/uploads/..%2f..%2fpackage.json",
    "/uploads/%2e%2e%2f%2e%2e%2fsrc%2fenv.ts",
  ];

  it("static asset routes never serve files outside their directory", async () => {
    for (const path of probes) {
      const res = await request(t.app).get(path);
      expect(res.status, path).toBeGreaterThanOrEqual(400);
      expect(res.text, path).not.toMatch(/"name": "@portfolio\/backend"|JWT_SECRET|DATABASE_URL/);
    }
  });

  it("still serves a legitimate seed asset", async () => {
    await request(t.app)
      .get("/seed-assets/tn.jpg")
      .expect(200)
      .expect("content-type", /image\/jpeg/);
  });

  it("ignores client filenames and rejects traversal in the upload folder field", async () => {
    const ok = await upload(PNG_BYTES, "../../../../etc/passwd.png", "image/png").expect(201);
    expect(t.storage.uploads.at(-1)!.folder).toBe("portfolio/library");
    expect(JSON.stringify(ok.body)).not.toContain("passwd");

    for (const folder of ["../../etc", "a/b", "..", "UPPER", "x%2f.."]) {
      const res = await upload(PNG_BYTES, "a.png", "image/png", { folder });
      expect(res.status, folder).toBe(400);
    }
  });

  it("local storage refuses to delete paths it did not create", async () => {
    const dir = mkdtempSync(join(tmpdir(), "uploads-"));
    const outside = join(dir, "..", `victim-${Date.now()}.txt`);
    writeFileSync(outside, "keep me");
    const storage = createLocalStorage(dir, "http://localhost");
    for (const id of [
      `local/../${outside.split("/").pop()}`,
      "local/../../etc/passwd",
      "local//etc/passwd",
      "local/a/b.png",
    ]) {
      await expect(storage.destroy(id, "image"), id).rejects.toThrow(/Refusing/);
    }
    expect(existsSync(outside)).toBe(true);

    const stored = await storage.upload(PNG_BYTES, {
      folder: "x",
      resourceType: "image",
      extension: "png",
    });
    await expect(storage.destroy(stored.publicId, "image")).resolves.toBeUndefined();
  });
});

describe("authentication bypass", () => {
  const secret = "test-secret-that-is-at-least-32-bytes-long";
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const me = (token: string) =>
    request(t.app).get(api("/auth/me")).set("Authorization", `Bearer ${token}`);
  const exp = () => Math.floor(Date.now() / 1000) + 3600;

  it('rejects alg "none" tokens', async () => {
    const token = `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub: "admin", tv: 1, exp: exp() })}.`;
    await me(token).expect(401);
  });

  it("rejects tokens signed with another secret", async () => {
    const { token } = await createJwt("another-secret-that-is-also-32-bytes-long!!").sign(1);
    await me(token).expect(401);
  });

  it("rejects a valid signature with the wrong subject or missing token version", async () => {
    const key = new TextEncoder().encode(secret);
    const wrongSub = await new SignJWT({ tv: 1 })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user")
      .setExpirationTime(exp())
      .sign(key);
    const noTv = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("admin")
      .setExpirationTime(exp())
      .sign(key);
    const tvString = await new SignJWT({ tv: "1" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("admin")
      .setExpirationTime(exp())
      .sign(key);
    for (const token of [wrongSub, noTv, tvString]) await me(token).expect(401);
  });

  it("rejects HS512 / algorithm confusion", async () => {
    const key = new TextEncoder().encode(secret);
    const token = await new SignJWT({ tv: 1 })
      .setProtectedHeader({ alg: "HS512" })
      .setSubject("admin")
      .setExpirationTime(exp())
      .sign(key);
    await me(token).expect(401);
  });

  it("rejects malformed Authorization headers", async () => {
    const { token } = await t.ctx.jwt.sign(1);
    for (const header of [
      token,
      `Basic ${token}`,
      `Bearer`,
      `Bearer  ${token}`,
      `bearer ${token}`,
      `Bearer ${token}x`,
    ]) {
      const res = await request(t.app).get(api("/auth/me")).set("Authorization", header);
      expect(res.status, header).toBe(401);
    }
  });

  it("does not expose admin routes through method or path tricks", async () => {
    for (const path of [
      "/API/V1/ADMIN/dashboard",
      "/api/v1/admin/./dashboard",
      "/api/v1//admin/dashboard",
      "/api/v1/admin/dashboard/",
    ]) {
      const res = await request(t.app).get(path);
      expect([401, 404], path).toContain(res.status);
    }
    const head = await request(t.app).head("/api/v1/admin/export");
    expect(head.status).toBe(401);
  });
});

describe("mass assignment & prototype pollution", () => {
  it("ignores server-owned fields in create/update bodies", async () => {
    const res = await request(t.app)
      .post(api("/projects"))
      .set(auth)
      .send({
        slug: "p",
        title: "P",
        summary: "s",
        category: "other",
        id: 999,
        sortOrder: 42,
        createdAt: "2000-01-01T00:00:00Z",
      })
      .expect(201);
    expect(res.body.id).not.toBe(999);
    expect(res.body.sortOrder).toBe(0);
    expect(res.body.createdAt).not.toContain("2000");

    const post = await request(t.app)
      .post(api("/blog"))
      .set(auth)
      .send({ slug: "b", title: "B", status: "published", publishedAt: "2000-01-01" })
      .expect(201);
    expect(post.body.status).toBe("draft");
    expect(post.body.publishedAt).toBeNull();
  });

  it("does not let profile writes target another row", async () => {
    await request(t.app)
      .put(api("/profile"))
      .set(auth)
      .send({
        id: 2,
        fullName: "N",
        handle: "n",
        headline: "h",
        typewriterLines: [],
        bio: "",
        location: null,
        email: "n@example.com",
        phone: null,
        showPhone: false,
        openToWork: false,
        avatarMediaId: null,
        cvMediaId: null,
      })
      .expect(200);
    const { rows } = await t.ctx.db.$client.query<{ id: number }>("SELECT id FROM profile");
    expect(rows.map((r) => r.id)).toEqual([1]);
  });

  it("does not pollute Object.prototype from JSON bodies", async () => {
    const body =
      '{"name":"x","category":"other","__proto__":{"polluted":"yes"},"constructor":{"prototype":{"polluted2":"yes"}}}';
    const res = await request(t.app)
      .post(api("/skills"))
      .set(auth)
      .set("Content-Type", "application/json")
      .send(body);
    expect(res.status).toBe(201);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(({} as Record<string, unknown>).polluted2).toBeUndefined();
    expect(res.body.polluted).toBeUndefined();
  });

  it("cannot change the message ip hash or inject unknown keys", async () => {
    await request(t.app).post("/api/v1/public/contact").send({
      name: "Bob",
      email: "b@example.com",
      subject: "Hi there",
      service: "other",
      message: "hello hello hello",
    });
    const id = (await request(t.app).get(api("/messages")).set(auth)).body.items[0].id;
    await request(t.app)
      .patch(api(`/messages/${id}`))
      .set(auth)
      .send({ status: "read", ipHash: "x", email: "evil@example.com" })
      .expect(200);
    const { rows } = await t.ctx.db.$client.query<{ ip_hash: string; email: string }>(
      "SELECT ip_hash, email FROM contact_messages",
    );
    expect(rows[0]!.ip_hash).not.toBe("x");
    expect(rows[0]!.email).toBe("b@example.com");
  });
});

describe("malicious uploads", () => {
  it.each([
    [
      "svg with script",
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      "x.svg",
      "image/svg+xml",
    ],
    ["html", "<!doctype html><script>alert(document.cookie)</script>", "x.png", "image/png"],
    ["php", "<?php system($_GET['c']); ?>                  ", "x.png", "image/png"],
    [
      "exe",
      "MZ\u0090\u0000\u0003\u0000\u0000\u0000\u0004\u0000\u0000\u0000",
      "x.jpg",
      "image/jpeg",
    ],
    ["gif (not allowed)", "GIF89a\u0001\u0000\u0001\u0000\u0000\u0000\u0000", "x.gif", "image/gif"],
  ])("rejects %s by content sniffing", async (_name, content, filename, type) => {
    const res = await upload(Buffer.from(content), filename, type);
    expect(res.status).toBe(415);
    expect(t.storage.uploads).toHaveLength(0);
  });

  it("enforces per-type size limits", async () => {
    const big = (mb: number) => Buffer.concat([PNG_BYTES, Buffer.alloc(mb * 1024 * 1024)]);
    expect((await upload(big(9), "big.png", "image/png")).status).toBe(413);
    expect((await upload(big(11), "huge.png", "image/png")).status).toBe(413);
    expect(t.storage.uploads).toHaveLength(0);
  });

  it("only allows one file and requires the file field", async () => {
    await request(t.app).post(api("/media")).set(auth).field("alt", "x").expect(400);
    const two = await request(t.app)
      .post(api("/media"))
      .set(auth)
      .attach("file", PNG_BYTES, "a.png")
      .attach("file", PNG_BYTES, "b.png");
    expect(two.status).toBeGreaterThanOrEqual(400);
    expect(two.status).toBeLessThan(500);
  });
});

describe("output encoding", () => {
  it("escapes XML special characters in RSS", async () => {
    await request(t.app).patch(api("/sections/blog")).set(auth).send({ enabled: true });
    const evil = `<script>alert(1)</script> & ]]> "x" 'y'`;
    const post = await request(t.app)
      .post(api("/blog"))
      .set(auth)
      .send({ slug: "x", title: evil, excerpt: evil, tags: [evil.slice(0, 40)] })
      .expect(201);
    await request(t.app)
      .post(api(`/blog/${post.body.id}/publish`))
      .set(auth)
      .expect(200);
    const rss = await request(t.app).get("/api/v1/public/blog/rss.xml").expect(200);
    expect(rss.text).not.toContain("<script>");
    expect(rss.text).toContain(
      "&lt;script&gt;alert(1)&lt;/script&gt; &amp; ]]&gt; &quot;x&quot; &apos;y&apos;",
    );
  });

  it("rejects slugs that could break URLs or markup", async () => {
    for (const slug of [
      "../etc",
      "a/b",
      "<x>",
      "a b",
      "javascript:alert(1)",
      "UPPER",
      "a--b",
      "-a",
    ]) {
      const res = await request(t.app).post(api("/blog")).set(auth).send({ slug, title: "t" });
      expect(res.status, slug).toBe(400);
    }
  });

  it("only accepts http(s) URLs for links rendered on the site", async () => {
    for (const repoUrl of [
      "javascript:alert(1)",
      "data:text/html,<script>",
      "file:///etc/passwd",
      "vbscript:x",
    ]) {
      const res = await request(t.app)
        .post(api("/projects"))
        .set(auth)
        .send({ slug: "p", title: "P", summary: "s", category: "other", repoUrl });
      expect(res.status, repoUrl).toBe(400);
    }
    const link = await request(t.app)
      .post(api("/social-links"))
      .set(auth)
      .send({ platform: "other", label: "x", url: "javascript:alert(1)" });
    expect(link.status).toBe(400);
  });
});

describe("headers, CORS and error handling", () => {
  it("sets security headers and hides the framework", async () => {
    const res = await request(t.app).get("/healthz");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(res.headers["strict-transport-security"]).toBeDefined();
  });

  it("only reflects allowlisted origins", async () => {
    const good = await request(t.app)
      .get("/api/v1/public/site")
      .set("Origin", "https://admin.trngnneee.io.vn");
    expect(good.headers["access-control-allow-origin"]).toBe("https://admin.trngnneee.io.vn");
    for (const origin of ["https://evil.com", "https://trngnneee.io.vn.evil.com", "null"]) {
      const res = await request(t.app).get("/api/v1/public/site").set("Origin", origin);
      expect(res.headers["access-control-allow-origin"], origin).toBeUndefined();
    }
  });

  it("returns 400 (not 500) for malformed or oversized JSON", async () => {
    const bad = await request(t.app)
      .post(api("/skills"))
      .set(auth)
      .set("Content-Type", "application/json")
      .send("{bad json");
    expect(bad.status).toBe(400);
    expect(JSON.stringify(bad.body)).not.toMatch(/at .*\.(js|ts):\d+/);

    const huge = await request(t.app)
      .post("/api/v1/public/contact")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ message: "x".repeat(2 * 1024 * 1024) }));
    expect(huge.status).toBe(413);
  });

  it("caps pagination and list sizes", async () => {
    await request(t.app).get(api("/media")).query({ page: "99999999" }).set(auth).expect(400);
    await request(t.app).get(api("/media")).query({ page: "-1" }).set(auth).expect(400);
    await request(t.app)
      .patch(api("/skills/reorder"))
      .set(auth)
      .send({ ids: Array.from({ length: 501 }, (_, i) => i + 1) })
      .expect(400);
  });

  it("never leaks internals on unexpected errors", async () => {
    const app = express();
    app.get("/boom", () => {
      throw new Error("connect ECONNREFUSED postgres://user:pass@db:5432 — secret detail");
    });
    app.use(errorHandler);
    const res = await request(app).get("/boom").expect(500);
    expect(res.body).toEqual({
      error: { code: "internal_error", message: "Internal server error" },
    });
  });
});
