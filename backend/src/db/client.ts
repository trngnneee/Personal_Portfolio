import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { logger } from "../lib/logger.js";
import * as schema from "./schema.js";

export type Db = NodePgDatabase<typeof schema> & { $client: pg.Pool };
/** A transaction handle; accepted anywhere a Db is for reads/writes. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type Executor = Db | Tx;

export interface DbOptions {
  url: string;
  /** TLS to the database (Supabase requires it). */
  ssl?: boolean;
  /** PEM CA bundle. When set, the server certificate is fully verified. */
  caCert?: string;
  max?: number;
}

/**
 * node-postgres lets `sslmode` in the URL override the `ssl` option (and treats
 * `require` as verify-full), so TLS is configured here only.
 */
function withoutSslMode(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete("sslmode");
    return u.toString();
  } catch {
    return url;
  }
}

let warnedUnverified = false;

export function createDb({ url, ssl = false, caCert, max = 10 }: DbOptions): Db {
  let tls: pg.PoolConfig["ssl"];
  if (ssl && caCert) {
    tls = { ca: caCert, rejectUnauthorized: true };
  } else if (ssl) {
    if (!warnedUnverified) {
      warnedUnverified = true;
      logger.warn(
        "DATABASE_SSL is on without DATABASE_CA_CERT: traffic is encrypted but the server certificate is not verified",
      );
    }
    tls = { rejectUnauthorized: false };
  }

  const pool = new pg.Pool({
    connectionString: withoutSslMode(url),
    max,
    ssl: tls,
    statement_timeout: 10_000,
    // Poolers (Supabase Supavisor) may drop idle client connections; recycle ours first.
    idleTimeoutMillis: 30_000,
    keepAlive: true,
  });
  pool.on("error", (err) => logger.error({ err }, "Idle database client error"));
  return drizzle({ client: pool, schema });
}
