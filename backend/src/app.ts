import { fileURLToPath } from "node:url";
import cors from "cors";
import { sql } from "drizzle-orm";
import express, { type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { AppContext } from "./context.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { createAdminRouter } from "./modules/admin.router.js";
import { createPublicRouter, sitemapHandler } from "./modules/public/public.router.js";

export const SEED_ASSETS_DIR = fileURLToPath(new URL("../seed/assets", import.meta.url));

export function createApp(ctx: AppContext): Express {
  const { env, db } = ctx;
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.CORS_ORIGINS, maxAge: 600 }));
  app.use(express.json({ limit: "1mb" }));
  if (env.NODE_ENV !== "test") app.use(pinoHttp({ logger }));

  app.get("/healthz", async (_req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      await db.execute(sql`SELECT 1`);
      res.json({ ok: true, db: "up" });
    } catch {
      res.status(503).json({ ok: false, db: "down" });
    }
  });
  app.get("/sitemap.xml", sitemapHandler(ctx));

  if (env.NODE_ENV !== "production") {
    // Dev-only: seed --no-upload and local uploads.
    app.use("/seed-assets", express.static(SEED_ASSETS_DIR, { fallthrough: false }));
    app.use("/uploads", express.static(env.UPLOADS_DIR, { fallthrough: false }));
  }

  app.use("/api/v1/public", createPublicRouter(ctx));
  app.use("/api/v1/admin", createAdminRouter(ctx).router);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
