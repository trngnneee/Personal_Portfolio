import type { ProfileInput } from "@portfolio/shared";
import { eq } from "drizzle-orm";
import type { Executor } from "../../db/client.js";
import { profile } from "../../db/schema.js";

export type ProfileRow = typeof profile.$inferSelect;

export async function getProfile(db: Executor): Promise<ProfileRow | undefined> {
  const [row] = await db.select().from(profile).where(eq(profile.id, 1));
  return row;
}

export async function upsertProfile(db: Executor, input: ProfileInput): Promise<ProfileRow> {
  const [row] = await db
    .insert(profile)
    .values({ id: 1, ...input })
    .onConflictDoUpdate({ target: profile.id, set: input })
    .returning();
  return row!;
}
