import type { AppContext } from "./context.js";
import { createDb } from "./db/client.js";
import { runMigrations } from "./db/migrate.js";
import { hasCloudinary, type Env } from "./env.js";
import { createCloudinaryStorage } from "./lib/cloudinary.js";
import { createJwt } from "./lib/jwt.js";
import { createResendMailer, noopMailer } from "./lib/mailer.js";
import { createLocalStorage } from "./lib/storage.js";
import { ensureSections } from "./modules/sections/service.js";

/** Production wiring: Postgres (migrated), Cloudinary (or local disk in dev), Resend if configured. */
export async function createContext(env: Env): Promise<AppContext> {
  const db = createDb({
    url: env.DATABASE_URL,
    ssl: env.DATABASE_SSL,
    caCert: env.DATABASE_CA_CERT || undefined,
    max: env.DATABASE_POOL_MAX,
  });
  await runMigrations(db);
  await ensureSections(db);

  const storage = hasCloudinary(env)
    ? createCloudinaryStorage({
        cloudName: env.CLOUDINARY_CLOUD_NAME,
        apiKey: env.CLOUDINARY_API_KEY,
        apiSecret: env.CLOUDINARY_API_SECRET,
      })
    : createLocalStorage(env.UPLOADS_DIR, env.PUBLIC_API_URL);

  return {
    env,
    db,
    jwt: createJwt(env.JWT_SECRET),
    storage,
    mailer: env.RESEND_API_KEY
      ? createResendMailer(env.RESEND_API_KEY, env.RESEND_FROM)
      : noopMailer,
  };
}
