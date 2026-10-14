import { eq, inArray } from "drizzle-orm";
import type { Executor } from "../../db/client.js";
import { blogPostMedia, media } from "../../db/schema.js";

const URL_RE = /https?:\/\/[^\s)"'<>\]]+/g;

/** Media rows whose URL appears in the markdown. */
export async function embeddedMediaIds(db: Executor, content: string): Promise<number[]> {
  const urls = [...new Set(content.match(URL_RE) ?? [])];
  if (urls.length === 0) return [];
  const rows = await db.select({ id: media.id }).from(media).where(inArray(media.url, urls));
  return rows.map((r) => r.id);
}

export async function syncPostMedia(db: Executor, postId: number, content: string): Promise<void> {
  await db.delete(blogPostMedia).where(eq(blogPostMedia.postId, postId));
  const ids = await embeddedMediaIds(db, content);
  if (ids.length) {
    await db.insert(blogPostMedia).values(ids.map((mediaId) => ({ postId, mediaId })));
  }
}

export async function postMediaIds(db: Executor, postId: number): Promise<number[]> {
  const rows = await db
    .select({ id: blogPostMedia.mediaId })
    .from(blogPostMedia)
    .where(eq(blogPostMedia.postId, postId));
  return rows.map((r) => r.id);
}
