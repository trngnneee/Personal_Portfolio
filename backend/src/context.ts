import type { Db } from "./db/client.js";
import type { Env } from "./env.js";
import type { Jwt } from "./lib/jwt.js";
import type { Mailer } from "./lib/mailer.js";
import type { MediaStorage } from "./lib/storage.js";

/** Everything a module needs; injected so tests can swap db/storage/mailer. */
export interface AppContext {
  env: Env;
  db: Db;
  jwt: Jwt;
  storage: MediaStorage;
  mailer: Mailer;
}
