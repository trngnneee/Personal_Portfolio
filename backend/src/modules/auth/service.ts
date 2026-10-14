import { eq, sql } from "drizzle-orm";
import type { Executor } from "../../db/client.js";
import { adminAccount } from "../../db/schema.js";
import { hashPassword } from "../../lib/password.js";

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

export async function getAccount(db: Executor) {
  const [row] = await db.select().from(adminAccount).where(eq(adminAccount.id, 1));
  return row;
}

/** Bump token_version → every issued JWT stops verifying. */
export async function revokeAllSessions(db: Executor): Promise<void> {
  await db
    .update(adminAccount)
    .set({ tokenVersion: sql`${adminAccount.tokenVersion} + 1` })
    .where(eq(adminAccount.id, 1));
}

/** Create or replace the single admin account (CLI only). */
export async function setAdminPassword(
  db: Executor,
  email: string,
  password: string,
): Promise<void> {
  const passwordHash = await hashPassword(password);
  const now = new Date();
  await db
    .insert(adminAccount)
    .values({ id: 1, email: email.toLowerCase(), passwordHash, passwordChangedAt: now })
    .onConflictDoUpdate({
      target: adminAccount.id,
      set: {
        email: email.toLowerCase(),
        passwordHash,
        passwordChangedAt: now,
        failedAttempts: 0,
        lockedUntil: null,
        tokenVersion: sql`${adminAccount.tokenVersion} + 1`,
      },
    });
}
