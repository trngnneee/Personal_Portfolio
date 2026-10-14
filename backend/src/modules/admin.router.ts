import { Router } from "express";
import type { AppContext } from "../context.js";
import { createClientIp } from "../lib/client-ip.js";
import { createLoginLimiter } from "../middleware/rate-limit.js";
import { requireAuth } from "../middleware/require-auth.js";
import { registerActivities } from "./activities/admin.router.js";
import { loginHandler, registerAuth } from "./auth/admin.router.js";
import { registerBlog } from "./blog/admin.router.js";
import { createSimpleResources } from "./crud/resources.js";
import { registerMedia } from "./media/admin.router.js";
import { registerMessages } from "./messages/admin.router.js";
import { registerProfile } from "./profile/admin.router.js";
import { registerSections } from "./sections/admin.router.js";
import { registerSystem } from "./system/admin.router.js";

/**
 * `protectedRoutes` holds every admin route except login; requireAuth is mounted
 * once in front of it, so a new route cannot be added without auth.
 */
export function createAdminRouter(ctx: AppContext) {
  const protectedRoutes = Router();
  registerAuth(ctx, protectedRoutes);
  registerSections(ctx, protectedRoutes);
  registerProfile(ctx, protectedRoutes);
  for (const resource of Object.values(createSimpleResources(ctx)))
    resource.register(protectedRoutes);
  registerActivities(ctx, protectedRoutes);
  registerBlog(ctx, protectedRoutes);
  registerMedia(ctx, protectedRoutes);
  registerMessages(ctx, protectedRoutes);
  registerSystem(ctx, protectedRoutes);

  const router = Router();
  router.post(
    "/auth/login",
    createLoginLimiter(createClientIp(ctx.env.CLIENT_IP_HEADER)),
    loginHandler(ctx),
  );
  router.use(requireAuth(ctx), protectedRoutes);

  return { router, protectedRoutes };
}
