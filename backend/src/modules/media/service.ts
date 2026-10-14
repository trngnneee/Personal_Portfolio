import { eq, inArray, sql } from "drizzle-orm";
import type { AppContext } from "../../context.js";
import type { Executor } from "../../db/client.js";
import { media } from "../../db/schema.js";
import { logger } from "../../lib/logger.js";
import { badRequest } from "../../middleware/error.js";

export type MediaRow = typeof media.$inferSelect;

/** Every column that can point at a media row. Keep in sync with schema.ts. */
const REFERENCES = [
  ["profile", "avatar_media_id"],
  ["profile", "cv_media_id"],
  ["projects", "cover_media_id"],
  ["experiences", "logo_media_id"],
  ["achievements", "media_id"],
  ["activity_images", "media_id"],
  ["blog_posts", "cover_media_id"],
  ["blog_post_media", "media_id"],
] as const;

const usageUnion = sql.raw(
  REFERENCES.map(
    ([table, column]) => `SELECT ${column} AS media_id FROM ${table} WHERE ${column} IS NOT NULL`,
  ).join(" UNION ALL "),
);

const ids = (values: Iterable<number | null | undefined>) => [
  ...new Set([...values].filter((v): v is number => typeof v === "number")),
];

export async function mediaUsage(db: Executor, mediaIds: number[]): Promise<Map<number, number>> {
  const usage = new Map<number, number>();
  if (mediaIds.length === 0) return usage;
  const { rows } = await db.execute<{ media_id: number; n: string }>(
    sql`SELECT media_id, COUNT(*) AS n FROM (${usageUnion}) refs
        WHERE media_id IN (${sql.join(
          mediaIds.map((id) => sql`${id}`),
          sql`, `,
        )})
        GROUP BY media_id`,
  );
  // COUNT() is bigint → string in node-postgres.
  for (const r of rows) usage.set(Number(r.media_id), Number(r.n));
  return usage;
}

export async function assertMedia(
  db: Executor,
  id: number | null | undefined,
  resourceType?: MediaRow["resourceType"],
): Promise<void> {
  if (id == null) return;
  const [row] = await db
    .select({ resourceType: media.resourceType })
    .from(media)
    .where(eq(media.id, id));
  if (!row) throw badRequest(`Media ${id} does not exist`);
  if (resourceType && row.resourceType !== resourceType) {
    throw badRequest(`Media ${id} must be of type ${resourceType}`);
  }
}

/** Delete media rows (and their stored files) that nothing references any more. */
export async function releaseMedia(
  ctx: AppContext,
  candidates: Iterable<number | null | undefined>,
): Promise<void> {
  const list = ids(candidates);
  if (list.length === 0) return;
  const usage = await mediaUsage(ctx.db, list);
  const orphanIds = list.filter((id) => !usage.has(id));
  if (orphanIds.length === 0) return;

  const orphans = await ctx.db.delete(media).where(inArray(media.id, orphanIds)).returning();
  await Promise.all(orphans.map((m) => destroyStored(ctx, m)));
}

export async function destroyStored(ctx: AppContext, row: MediaRow): Promise<void> {
  if (!row.publicId) return;
  try {
    await ctx.storage.destroy(row.publicId, row.resourceType);
  } catch (err) {
    logger.warn({ err, publicId: row.publicId }, "Failed to destroy stored media");
  }
}

/** Shape sent to the admin UI. */
export function mediaDto(row: MediaRow) {
  return {
    id: row.id,
    url: row.url,
    publicId: row.publicId,
    resourceType: row.resourceType,
    format: row.format,
    width: row.width,
    height: row.height,
    bytes: row.bytes,
    alt: row.alt,
    folder: row.folder,
    createdAt: row.createdAt,
  };
}
export type MediaDto = ReturnType<typeof mediaDto>;

export async function loadMedia(
  db: Executor,
  values: Iterable<number | null | undefined>,
): Promise<Map<number, MediaRow>> {
  const list = ids(values);
  if (list.length === 0) return new Map();
  const rows = await db.select().from(media).where(inArray(media.id, list));
  return new Map(rows.map((m) => [m.id, m]));
}
