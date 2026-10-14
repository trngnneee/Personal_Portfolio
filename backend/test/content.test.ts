import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { useTestApp, login, PNG_BYTES, type TestApp } from "./helpers.js";

const getT = useTestApp();

let t: TestApp;
let auth: { Authorization: string };
const api = (path: string) => `/api/v1/admin${path}`;

beforeEach(async () => {
  t = getT();
  auth = { Authorization: `Bearer ${await login(t)}` };
});

const uploadPng = async (alt = "pic") => {
  const res = await request(t.app)
    .post(api("/media"))
    .set(auth)
    .field("alt", alt)
    .attach("file", PNG_BYTES, { filename: "a.png", contentType: "image/png" })
    .expect(201);
  return res.body as { id: number; url: string };
};

describe("skills CRUD", () => {
  it("creates, reads, updates, deletes", async () => {
    const created = await request(t.app)
      .post(api("/skills"))
      .set(auth)
      .send({ name: "Go", category: "languages" })
      .expect(201);
    expect(created.body).toMatchObject({
      name: "Go",
      category: "languages",
      published: true,
      sortOrder: 0,
    });
    const id = created.body.id as number;

    await request(t.app)
      .get(api(`/skills/${id}`))
      .set(auth)
      .expect(200);
    const updated = await request(t.app)
      .patch(api(`/skills/${id}`))
      .set(auth)
      .send({ level: 80 })
      .expect(200);
    expect(updated.body).toMatchObject({ name: "Go", level: 80 });

    await request(t.app)
      .delete(api(`/skills/${id}`))
      .set(auth)
      .expect(204);
    await request(t.app)
      .get(api(`/skills/${id}`))
      .set(auth)
      .expect(404);
    await request(t.app)
      .delete(api(`/skills/${id}`))
      .set(auth)
      .expect(404);
  });

  it("validates input with a 400 envelope", async () => {
    const res = await request(t.app)
      .post(api("/skills"))
      .set(auth)
      .send({ name: "", category: "nope" })
      .expect(400);
    expect(res.body.error.code).toBe("validation_error");
    expect(res.body.error.details).toBeInstanceOf(Array);
  });

  it("reorders in one transaction and rejects unknown ids", async () => {
    const ids: number[] = [];
    for (const name of ["A", "B", "C"]) {
      ids.push(
        (await request(t.app).post(api("/skills")).set(auth).send({ name, category: "other" })).body
          .id,
      );
    }
    await request(t.app)
      .patch(api("/skills/reorder"))
      .set(auth)
      .send({ ids: [ids[2], ids[0], ids[1]] })
      .expect(204);
    const list = await request(t.app).get(api("/skills")).set(auth).expect(200);
    expect(list.body.items.map((s: { name: string }) => s.name)).toEqual(["C", "A", "B"]);

    await request(t.app)
      .patch(api("/skills/reorder"))
      .set(auth)
      .send({ ids: [ids[0], 999] })
      .expect(400);
    const after = await request(t.app).get(api("/skills")).set(auth);
    expect(after.body.items.map((s: { name: string }) => s.name)).toEqual(["C", "A", "B"]);
  });
});

describe("media", () => {
  it("sniffs magic bytes instead of trusting Content-Type", async () => {
    const res = await request(t.app)
      .post(api("/media"))
      .set(auth)
      .attach("file", Buffer.from("<?php echo 'hi'; ?> padding padding"), {
        filename: "evil.png",
        contentType: "image/png",
      });
    expect(res.status).toBe(415);
    expect(t.storage.uploads).toHaveLength(0);
  });

  it("uploads to the configured folder and lists with usage counts", async () => {
    await uploadPng("hello");
    expect(t.storage.uploads[0]).toMatchObject({
      folder: "portfolio/library",
      resourceType: "image",
      extension: "png",
    });
    const list = await request(t.app).get(api("/media")).set(auth).expect(200);
    expect(list.body).toMatchObject({ total: 1, page: 1 });
    expect(list.body.items[0]).toMatchObject({ alt: "hello", usageCount: 0 });
  });

  it("blocks deleting media that is in use (409) and allows it once free", async () => {
    const m = await uploadPng();
    const p = await request(t.app)
      .post(api("/projects"))
      .set(auth)
      .send({ slug: "p", title: "P", summary: "s", category: "other", coverMediaId: m.id })
      .expect(201);
    expect(p.body.cover.url).toBe(m.url);

    const blocked = await request(t.app)
      .delete(api(`/media/${m.id}`))
      .set(auth)
      .expect(409);
    expect(blocked.body.error.details.usageCount).toBe(1);

    // Changing the cover orphans the old media → row and stored file are removed.
    await request(t.app)
      .patch(api(`/projects/${p.body.id}`))
      .set(auth)
      .send({ coverMediaId: null })
      .expect(200);
    expect(t.storage.destroyed).toEqual(["test/1"]);
    await request(t.app)
      .delete(api(`/media/${m.id}`))
      .set(auth)
      .expect(404);
  });

  it("does not delete media still used elsewhere", async () => {
    const m = await uploadPng();
    const body = { summary: "s", category: "other", coverMediaId: m.id };
    const a = await request(t.app)
      .post(api("/projects"))
      .set(auth)
      .send({ ...body, slug: "a", title: "A" });
    await request(t.app)
      .post(api("/projects"))
      .set(auth)
      .send({ ...body, slug: "b", title: "B" });
    await request(t.app)
      .delete(api(`/projects/${a.body.id}`))
      .set(auth)
      .expect(204);
    expect(t.storage.destroyed).toEqual([]);
  });

  it("rejects references to missing media", async () => {
    await request(t.app)
      .post(api("/projects"))
      .set(auth)
      .send({ slug: "p", title: "P", summary: "s", category: "other", coverMediaId: 42 })
      .expect(400);
  });

  it("tracks images embedded in blog markdown", async () => {
    const m = await uploadPng();
    const post = await request(t.app)
      .post(api("/blog"))
      .set(auth)
      .send({ slug: "x", title: "X", content: `Look: ![pic](${m.url})` })
      .expect(201);
    expect(post.body.readingMinutes).toBe(1);
    await request(t.app)
      .delete(api(`/media/${m.id}`))
      .set(auth)
      .expect(409);
    await request(t.app)
      .patch(api(`/blog/${post.body.id}`))
      .set(auth)
      .send({ content: "no images" })
      .expect(200);
    expect(t.storage.destroyed).toEqual(["test/1"]);
  });
});

describe("activity gallery", () => {
  it("attaches, reorders, detaches and cascades", async () => {
    const act = await request(t.app)
      .post(api("/activities"))
      .set(auth)
      .send({ title: "Volunteer" })
      .expect(201);
    const id = act.body.id as number;
    const a = await uploadPng("a");
    const b = await uploadPng("b");

    await request(t.app)
      .post(api(`/activities/${id}/images`))
      .set(auth)
      .send({ mediaId: a.id })
      .expect(201);
    const two = await request(t.app)
      .post(api(`/activities/${id}/images`))
      .set(auth)
      .send({ mediaId: b.id })
      .expect(201);
    expect(two.body.images.map((i: { alt: string }) => i.alt)).toEqual(["a", "b"]);
    await request(t.app)
      .post(api(`/activities/${id}/images`))
      .set(auth)
      .send({ mediaId: b.id })
      .expect(409);

    const reordered = await request(t.app)
      .patch(api(`/activities/${id}/images`))
      .set(auth)
      .send({ ids: [b.id, a.id] })
      .expect(200);
    expect(reordered.body.images.map((i: { alt: string }) => i.alt)).toEqual(["b", "a"]);

    await request(t.app)
      .delete(api(`/activities/${id}/images/${a.id}`))
      .set(auth)
      .expect(204);
    expect(t.storage.destroyed).toEqual(["test/1"]);

    const site = await request(t.app).get("/api/v1/public/site");
    expect(site.body.activities[0].images).toHaveLength(1);

    await request(t.app)
      .delete(api(`/activities/${id}`))
      .set(auth)
      .expect(204);
    expect(t.storage.destroyed).toEqual(["test/1", "test/2"]);
  });
});

describe("messages, dashboard, export", () => {
  it("manages inbox status and never leaks ip_hash", async () => {
    await request(t.app).post("/api/v1/public/contact").send({
      name: "Bob",
      email: "bob@example.com",
      subject: "Hi there",
      service: "other",
      message: "Hello from the test suite",
    });
    const list = await request(t.app).get(api("/messages?status=new")).set(auth).expect(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].ipHash).toBeUndefined();

    const id = list.body.items[0].id as number;
    await request(t.app)
      .patch(api(`/messages/${id}`))
      .set(auth)
      .send({ status: "read" })
      .expect(200);
    const dash = await request(t.app).get(api("/dashboard")).set(auth).expect(200);
    expect(dash.body.counts.messagesNew).toBe(0);
    expect(dash.body.disabledSections).toEqual(["blog"]);
    expect(dash.body.messagesPerDay).toHaveLength(14);
    expect(dash.body.messagesPerDay.at(-1).count).toBe(1);

    const dump = await request(t.app).get(api("/export")).set(auth).expect(200);
    expect(dump.body.tables.contactMessages).toHaveLength(1);
    expect(dump.body.tables.adminAccount).toBeUndefined();
  });
});
