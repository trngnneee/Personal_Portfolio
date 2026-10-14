import type { SectionKey } from "@portfolio/shared";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "express";
import type { Executor } from "../db/client.js";
import { siteSections } from "../db/schema.js";
import { notFound } from "./error.js";

export async function isSectionEnabled(db: Executor, key: SectionKey): Promise<boolean> {
  const [row] = await db
    .select({ enabled: siteSections.enabled })
    .from(siteSections)
    .where(eq(siteSections.key, key));
  return row?.enabled ?? false;
}

/** 404 for public routes whose section is switched off. */
export function requireSection(db: Executor, key: SectionKey): RequestHandler {
  return async (_req, _res, next) => {
    if (!(await isSectionEnabled(db, key))) throw notFound();
    next();
  };
}
