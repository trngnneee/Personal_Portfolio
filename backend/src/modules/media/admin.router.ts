import { mediaListQuerySchema, mediaPatchSchema } from "@portfolio/shared";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import type { Router } from "express";
import multer from "multer";
import { z } from "zod";
import type { AppContext } from "../../context.js";
import { media } from "../../db/schema.js";
import { detectFileType } from "../../lib/file-type.js";
import { AppError, badRequest, conflict, notFound } from "../../middleware/error.js";
import { parseBody, parseId, parseQuery } from "../../middleware/validate.js";
import { destroyStored, mediaDto, mediaUsage } from "./service.js";

const PAGE_SIZE = 24;

/** Treat %, _ and \\ in user search as literals (Postgres' default LIKE escape is \\). */
export const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 5 },
});

const uploadFieldsSchema = z.object({
  alt: z.string().trim().max(300).default(""),
  folder: z
    .string()
    .trim()
    .max(60)
    .regex(/^[a-z0-9-]*$/, "Lowercase letters, digits and dashes only")
    .default("library"),
});

export function registerMedia(ctx: AppContext, router: Router): void {
  const { db, env, storage } = ctx;

  router.get("/media", async (req, res) => {
    const { page = 1, q, folder } = parseQuery(mediaListQuerySchema, req);
    const filters: SQL[] = [];
    if (q) {
      const pattern = `%${escapeLike(q)}%`;
      filters.push(or(ilike(media.alt, pattern), ilike(media.url, pattern))!);
    }
    if (folder) filters.push(eq(media.folder, folder));
    const where = filters.length ? and(...filters) : undefined;

    const [agg] = await db.select({ n: count() }).from(media).where(where);
    const total = agg?.n ?? 0;
    const rows = await db
      .select()
      .from(media)
      .where(where)
      .orderBy(desc(media.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);
    const usage = await mediaUsage(
      db,
      rows.map((r) => r.id),
    );
    res.json({
      items: rows.map((r) => ({ ...mediaDto(r), usageCount: usage.get(r.id) ?? 0 })),
      page,
      pageSize: PAGE_SIZE,
      total,
    });
  });

  router.post("/media", upload.single("file"), async (req, res) => {
    if (!req.file) throw badRequest('Missing multipart field "file"');
    const fields = uploadFieldsSchema.parse(req.body ?? {});
    const detected = detectFileType(req.file.buffer);
    if (!detected)
      throw new AppError(415, "unsupported_media_type", "Allowed: jpg, png, webp, avif, pdf");
    if (req.file.size > detected.maxBytes) {
      throw new AppError(
        413,
        "file_too_large",
        `Max ${detected.maxBytes / 1024 / 1024}MB for ${detected.extension}`,
      );
    }

    const stored = await storage.upload(req.file.buffer, {
      folder: `${env.CLOUDINARY_FOLDER}/${fields.folder}`,
      resourceType: detected.resourceType,
      extension: detected.extension,
    });
    const [row] = await db
      .insert(media)
      .values({
        publicId: stored.publicId,
        url: stored.url,
        resourceType: detected.resourceType,
        format: stored.format,
        width: stored.width,
        height: stored.height,
        bytes: stored.bytes,
        alt: fields.alt,
        folder: fields.folder,
      })
      .returning();
    res.status(201).json({ ...mediaDto(row!), usageCount: 0 });
  });

  router.patch("/media/:id", async (req, res) => {
    const { alt } = parseBody(mediaPatchSchema, req);
    const [row] = await db
      .update(media)
      .set({ alt })
      .where(eq(media.id, parseId(req)))
      .returning();
    if (!row) throw notFound();
    res.json(mediaDto(row));
  });

  router.delete("/media/:id", async (req, res) => {
    const id = parseId(req);
    const [row] = await db.select().from(media).where(eq(media.id, id));
    if (!row) throw notFound();
    const used = (await mediaUsage(db, [id])).get(id) ?? 0;
    if (used > 0) throw conflict("Media is still in use", { usageCount: used });
    await db.delete(media).where(eq(media.id, id));
    await destroyStored(ctx, row);
    res.status(204).end();
  });
}
