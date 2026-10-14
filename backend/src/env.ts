import { z } from "zod";

const csv = z
  .string()
  .default("")
  .transform((v) =>
    v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: csv,
  // Header holding the real client IP, set by the outermost proxy (Cloudflare: cf-connecting-ip).
  // Empty → req.ip. Keys the rate limiters and the contact IP hash.
  CLIENT_IP_HEADER: z.string().trim().toLowerCase().default(""),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "Must be a postgres:// URL"),
  // Supabase (and most managed Postgres) require TLS; local Docker doesn't.
  DATABASE_SSL: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  // Optional PEM CA (e.g. Supabase "SSL certificate") → full certificate verification.
  DATABASE_CA_CERT: z
    .string()
    .default("")
    .transform((v) => v.replace(/\\n/g, "\n").trim()),
  // Supabase poolers cap connections per project; keep this below the pool size.
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  // Dev-only upload dir used when Cloudinary isn't configured.
  UPLOADS_DIR: z.string().min(1).default("./data/uploads"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 bytes"),
  IP_HASH_SALT: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),
  CLOUDINARY_FOLDER: z.string().min(1).default("portfolio"),
  RESEND_API_KEY: z.string().default(""),
  RESEND_FROM: z.string().default("Portfolio <noreply@trngnneee.io.vn>"),
  // Canonical public site URL (sitemap, RSS, email links).
  PUBLIC_SITE_URL: z.url().default("http://localhost:5173"),
  // This API's own public URL (dev uploads / seed assets).
  PUBLIC_API_URL: z.url().default("http://localhost:4000"),
});

export type Env = z.infer<typeof envSchema>;

/** Parse env once and fail fast with a readable message. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment:\n${issues}`);
  }
  const env = parsed.data;
  if (env.NODE_ENV === "production" && !hasCloudinary(env)) {
    throw new Error("Invalid environment:\n  - CLOUDINARY_*: required in production");
  }
  return env;
}

export function hasCloudinary(env: Env): boolean {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}
