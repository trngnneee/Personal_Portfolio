import { activityImageAttachSchema, activitySchema, reorderSchema } from "@portfolio/shared";
import { and, asc, eq, max } from "drizzle-orm";
import type { Router } from "express";
import type { AppContext } from "../../context.js";
import type { Executor } from "../../db/client.js";
import { activities, activityImages } from "../../db/schema.js";
import { badRequest, conflict, notFound } from "../../middleware/error.js";
import { parseBody, parseId } from "../../middleware/validate.js";
import { createCrud, isUniqueViolation, type Row } from "../crud/crud.js";
import { assertMedia, loadMedia, mediaDto, releaseMedia } from "../media/service.js";

export async function imageIdsOf(db: Executor, activityId: number): Promise<number[]> {
  const rows = await db
    .select({ mediaId: activityImages.mediaId })
    .from(activityImages)
    .where(eq(activityImages.activityId, activityId))
    .orderBy(asc(activityImages.sortOrder));
  return rows.map((r) => r.mediaId);
}

export function registerActivities(ctx: AppContext, router: Router) {
  const { db } = ctx;

  const crud = createCrud(ctx, {
    path: "/activities",
    table: activities,
    columns: { id: activities.id, sortOrder: activities.sortOrder },
    schema: activitySchema,
    extraMediaIds: imageIdsOf,
    decorate: async (db, rows: Row[]) => {
      const imagesByActivity = new Map(
        await Promise.all(rows.map(async (r) => [r.id, await imageIdsOf(db, r.id)] as const)),
      );
      const mediaById = await loadMedia(db, [...imagesByActivity.values()].flat());
      return rows.map((r) => ({
        ...r,
        images: (imagesByActivity.get(r.id) ?? []).flatMap((id) => {
          const m = mediaById.get(id);
          return m ? [mediaDto(m)] : [];
        }),
      }));
    },
  });

  const requireActivity = async (id: number) => {
    if (!(await crud.getRow(id))) throw notFound();
  };

  // Gallery routes first, then the generic CRUD.
  router.post("/activities/:id/images", async (req, res) => {
    const id = parseId(req);
    await requireActivity(id);
    const { mediaId } = parseBody(activityImageAttachSchema, req);
    await assertMedia(db, mediaId, "image");
    try {
      await db.transaction(async (tx) => {
        const [agg] = await tx
          .select({ v: max(activityImages.sortOrder) })
          .from(activityImages)
          .where(eq(activityImages.activityId, id));
        await tx
          .insert(activityImages)
          .values({ activityId: id, mediaId, sortOrder: (agg?.v ?? -1) + 1 });
      });
    } catch (err) {
      if (isUniqueViolation(err)) throw conflict("Image already attached");
      throw err;
    }
    res.status(201).json(await crud.get(id));
  });

  router.patch("/activities/:id/images", async (req, res) => {
    const id = parseId(req);
    await requireActivity(id);
    const { ids } = parseBody(reorderSchema, req);
    const current = await imageIdsOf(db, id);
    if (ids.length !== current.length || !ids.every((m) => current.includes(m))) {
      throw badRequest("ids must list every attached image exactly once");
    }
    await db.transaction(async (tx) => {
      for (const [index, mediaId] of ids.entries()) {
        await tx
          .update(activityImages)
          .set({ sortOrder: index })
          .where(and(eq(activityImages.activityId, id), eq(activityImages.mediaId, mediaId)));
      }
    });
    res.json(await crud.get(id));
  });

  router.delete("/activities/:id/images/:mediaId", async (req, res) => {
    const id = parseId(req);
    const mediaId = parseId(req, "mediaId");
    await requireActivity(id);
    const removed = await db
      .delete(activityImages)
      .where(and(eq(activityImages.activityId, id), eq(activityImages.mediaId, mediaId)))
      .returning();
    if (removed.length === 0) throw notFound("Image not attached");
    await releaseMedia(ctx, [mediaId]);
    res.status(204).end();
  });

  crud.register(router);
  return crud;
}
