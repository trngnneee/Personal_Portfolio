import { sql } from "drizzle-orm";
import type { Express } from "express";
import pg from "pg";
import request from "supertest";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { createApp } from "../src/app.js";
import type { AppContext } from "../src/context.js";
import { createDb, type Db } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import { loadEnv } from "../src/env.js";
import { createJwt } from "../src/lib/jwt.js";
import type { Mail } from "../src/lib/mailer.js";
import type { MediaStorage, UploadOptions } from "../src/lib/storage.js";
import { setAdminPassword } from "../src/modules/auth/service.js";
import { ensureSections } from "../src/modules/sections/service.js";

export const ADMIN_EMAIL = "admin@test.local";
export const ADMIN_PASSWORD = "correct-horse-battery";

export interface FakeStorage extends MediaStorage {
  uploads: UploadOptions[];
  destroyed: string[];
}

export function fakeStorage(): FakeStorage {
  let n = 0;
  const s: FakeStorage = {
    uploads: [],
    destroyed: [],
    async upload(data, options) {
      s.uploads.push(options);
      n += 1;
      return {
        publicId: `test/${n}`,
        url: `https://res.cloudinary.com/demo/image/upload/test/${n}.${options.extension}`,
        format: options.extension,
        width: 10,
        height: 10,
        bytes: typeof data === "string" ? 0 : data.length,
      };
    },
    async destroy(publicId) {
      s.destroyed.push(publicId);
    },
  };
  return s;
}

export interface TestApp {
  app: Express;
  ctx: AppContext;
  storage: FakeStorage;
  mails: Mail[];
}

// Server used to create one throwaway database per test file.
const SERVER_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://portfolio:portfolio@localhost:5432/postgres";

const env = loadEnv({
  NODE_ENV: "test",
  DATABASE_URL: SERVER_URL,
  JWT_SECRET: "test-secret-that-is-at-least-32-bytes-long",
  IP_HASH_SALT: "salt",
  PUBLIC_SITE_URL: "https://trngnneee.io.vn",
  CORS_ORIGINS: "https://trngnneee.io.vn,https://admin.trngnneee.io.vn",
});

/**
 * Registers hooks: a fresh database per file, truncated before each test.
 * Returns a getter for the current test's app (fresh rate limiters, fake storage/mailer).
 */
export function useTestApp(): () => TestApp {
  const dbName = `portfolio_test_${process.pid}_${Math.random().toString(36).slice(2, 8)}`;
  let db: Db;
  let current: TestApp | undefined;

  const admin = async (statement: string) => {
    const client = new pg.Client({ connectionString: SERVER_URL });
    await client.connect();
    try {
      await client.query(statement);
    } finally {
      await client.end();
    }
  };

  beforeAll(async () => {
    await admin(`CREATE DATABASE "${dbName}"`);
    const url = new URL(SERVER_URL);
    url.pathname = `/${dbName}`;
    db = createDb({ url: url.toString(), max: 4 });
    await runMigrations(db);
  });

  beforeEach(async () => {
    const { rows } = await db.execute<{ tablename: string }>(
      sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    );
    const tables = rows.map((r) => `"${r.tablename}"`).join(", ");
    await db.execute(sql.raw(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`));
    await ensureSections(db);

    const storage = fakeStorage();
    const mails: Mail[] = [];
    const ctx: AppContext = {
      env,
      db,
      jwt: createJwt(env.JWT_SECRET),
      storage,
      mailer: { send: async (m) => void mails.push(m) },
    };
    current = { app: createApp(ctx), ctx, storage, mails };
  });

  afterAll(async () => {
    await db?.$client.end();
    await admin(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
  });

  return () => {
    if (!current) throw new Error("useTestApp(): called outside a test");
    return current;
  };
}

export async function login(t: TestApp): Promise<string> {
  await setAdminPassword(t.ctx.db, ADMIN_EMAIL, ADMIN_PASSWORD);
  const res = await request(t.app)
    .post("/api/v1/admin/auth/login")
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (res.status !== 200)
    throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.token as string;
}

/** Smallest valid PNG header — enough for magic-byte sniffing. */
export const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32),
]);
