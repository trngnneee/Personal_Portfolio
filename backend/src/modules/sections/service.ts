import {
  LOCKED_SECTIONS,
  SECTION_DEFAULTS,
  type SectionKey,
  type SectionPatchInput,
} from "@portfolio/shared";
import { asc, eq } from "drizzle-orm";
import type { Executor } from "../../db/client.js";
import { siteSections } from "../../db/schema.js";
import { badRequest, notFound } from "../../middleware/error.js";

export type SectionRow = typeof siteSections.$inferSelect;

export function listSections(db: Executor): Promise<SectionRow[]> {
  return db.select().from(siteSections).orderBy(asc(siteSections.sortOrder));
}

/** Insert any missing section rows with defaults; never overwrite admin edits. */
export async function ensureSections(db: Executor): Promise<void> {
  await db
    .insert(siteSections)
    .values(SECTION_DEFAULTS.map((s, index) => ({ ...s, sortOrder: index })))
    .onConflictDoNothing();
}

export async function patchSection(
  db: Executor,
  key: SectionKey,
  input: SectionPatchInput,
): Promise<SectionRow> {
  if (input.enabled === false && LOCKED_SECTIONS.includes(key)) {
    throw badRequest(`Section "${key}" cannot be disabled`);
  }
  const [row] = await db
    .update(siteSections)
    .set(input)
    .where(eq(siteSections.key, key))
    .returning();
  if (!row) throw notFound();
  return row;
}

export async function reorderSections(db: Executor, keys: SectionKey[]): Promise<void> {
  if (new Set(keys).size !== keys.length) throw badRequest("Duplicate section keys");
  await db.transaction(async (tx) => {
    for (const [index, key] of keys.entries()) {
      await tx.update(siteSections).set({ sortOrder: index }).where(eq(siteSections.key, key));
    }
  });
}
