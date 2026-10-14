import { blogPostSchema, readingMinutes } from "@portfolio/shared";
import { eq } from "drizzle-orm";
import type { Router } from "express";
import type { AppContext } from "../../context.js";
import { blogPosts } from "../../db/schema.js";
import { notFound } from "../../middleware/error.js";
import { parseId } from "../../middleware/validate.js";
import { createCrud } from "../crud/crud.js";
import { postMediaIds, syncPostMedia } from "./service.js";

export function registerBlog(ctx: AppContext, router: Router) {
  const { db } = ctx;

  const crud = createCrud(ctx, {
    path: "/blog",
    table: blogPosts,
    columns: { id: blogPosts.id },
    schema: blogPostSchema,
    mediaFields: { coverMediaId: "cover" },
    extraMediaIds: postMediaIds,
    prepare: (values) => {
      if (typeof values.content === "string")
        values.readingMinutes = readingMinutes(values.content);
      return values;
    },
    afterWrite: (tx, row) => syncPostMedia(tx, row.id, String(row.content ?? "")),
  });

  const setStatus = async (id: number, published: boolean) => {
    const row = await crud.getRow(id);
    if (!row) throw notFound();
    await db
      .update(blogPosts)
      .set(
        published
          ? { status: "published", publishedAt: (row.publishedAt as Date | null) ?? new Date() }
          : { status: "draft" },
      )
      .where(eq(blogPosts.id, id));
    return crud.get(id);
  };

  router.post("/blog/:id/publish", async (req, res) => {
    res.json(await setStatus(parseId(req), true));
  });
  router.post("/blog/:id/unpublish", async (req, res) => {
    res.json(await setStatus(parseId(req), false));
  });

  crud.register(router);
  return crud;
}
