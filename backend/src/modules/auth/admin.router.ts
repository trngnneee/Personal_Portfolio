import { changePasswordSchema, loginSchema } from "@portfolio/shared";
import { eq } from "drizzle-orm";
import type { RequestHandler, Router } from "express";
import type { AppContext } from "../../context.js";
import { adminAccount } from "../../db/schema.js";
import { hashPassword, verifyDummy, verifyPassword } from "../../lib/password.js";
import { AppError, badRequest, unauthorized } from "../../middleware/error.js";
import { parseBody } from "../../middleware/validate.js";
import { getAccount, LOCKOUT_MS, MAX_FAILED_ATTEMPTS, revokeAllSessions } from "./service.js";

const INVALID = "Invalid credentials";

/** Public: POST /auth/login. Must be registered BEFORE requireAuth. */
export function loginHandler({ db, jwt }: AppContext): RequestHandler {
  return async (req, res) => {
    const { email, password } = parseBody(loginSchema, req);
    const account = await getAccount(db);

    if (!account) {
      await verifyDummy(password);
      throw unauthorized(INVALID);
    }

    const now = Date.now();
    if (account.lockedUntil && account.lockedUntil.getTime() > now) {
      await verifyDummy(password);
      throw new AppError(423, "locked", "Too many failed attempts. Try again later.", {
        lockedUntil: account.lockedUntil.toISOString(),
      });
    }

    // Always run argon2 so a wrong email costs the same as a wrong password.
    const ok =
      account.email === email
        ? await verifyPassword(account.passwordHash, password)
        : await verifyDummy(password);

    if (!ok) {
      const attempts = account.failedAttempts + 1;
      const locked = attempts >= MAX_FAILED_ATTEMPTS;
      await db
        .update(adminAccount)
        .set({
          failedAttempts: locked ? 0 : attempts,
          lockedUntil: locked ? new Date(now + LOCKOUT_MS) : account.lockedUntil,
        })
        .where(eq(adminAccount.id, 1));
      throw unauthorized(INVALID);
    }

    await db
      .update(adminAccount)
      .set({ failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date(now) })
      .where(eq(adminAccount.id, 1));

    res.json(await jwt.sign(account.tokenVersion));
  };
}

/** Authenticated auth routes. */
export function registerAuth({ db }: AppContext, router: Router): void {
  router.get("/auth/me", async (_req, res) => {
    const account = await getAccount(db);
    if (!account) throw unauthorized();
    res.json({
      email: account.email,
      lastLoginAt: account.lastLoginAt,
      passwordChangedAt: account.passwordChangedAt,
    });
  });

  // Tokens are stateless; the client drops its copy.
  router.post("/auth/logout", (_req, res) => {
    res.status(204).end();
  });

  router.post("/auth/logout-all", async (_req, res) => {
    await revokeAllSessions(db);
    res.status(204).end();
  });

  router.post("/auth/change-password", async (req, res) => {
    const { currentPassword, newPassword } = parseBody(changePasswordSchema, req);
    const account = await getAccount(db);
    if (!account) throw unauthorized();
    if (!(await verifyPassword(account.passwordHash, currentPassword))) {
      throw badRequest("Current password is incorrect");
    }
    await db
      .update(adminAccount)
      .set({ passwordHash: await hashPassword(newPassword), passwordChangedAt: new Date() })
      .where(eq(adminAccount.id, 1));
    await revokeAllSessions(db);
    res.status(204).end();
  });
}
