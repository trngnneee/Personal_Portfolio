/**
 * Create or reset the single admin account.
 *   npm run admin:set-password -w backend -- --email you@example.com
 * The password is read from a hidden prompt (or ADMIN_PASSWORD_STDIN=1 + stdin for automation).
 */
import { parseArgs } from "node:util";
import { PASSWORD_MIN_LENGTH } from "@portfolio/shared";
import { z } from "zod";
import { createDb } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import { setAdminPassword } from "../src/modules/auth/service.js";

function readHidden(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      // Piped input: read first line.
      let data = "";
      stdin.setEncoding("utf8");
      stdin.on("data", (c) => (data += c));
      stdin.on("end", () => resolve(data.split(/\r?\n/)[0] ?? ""));
      stdin.on("error", reject);
      return;
    }
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (ch: string) => {
      if (ch === "\r" || ch === "\n" || ch === "\u0004") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off("data", onData);
        stdout.write("\n");
        resolve(value);
      } else if (ch === "\u0003") {
        stdout.write("\n");
        process.exit(130);
      } else if (ch === "\u007f") {
        value = value.slice(0, -1);
      } else {
        value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const { values } = parseArgs({ options: { email: { type: "string" } } });
  const email = z.email().safeParse(values.email);
  if (!email.success) throw new Error("Usage: --email <valid email address, e.g. you@example.com>");

  const password = await readHidden("New admin password: ");
  if (password.length < PASSWORD_MIN_LENGTH)
    throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  if (process.stdin.isTTY) {
    const again = await readHidden("Repeat password: ");
    if (again !== password) throw new Error("Passwords do not match");
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const db = createDb({
    url,
    ssl: process.env.DATABASE_SSL === "true",
    caCert: process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n") || undefined,
    max: 1,
  });
  try {
    await runMigrations(db);
    await setAdminPassword(db, email.data, password);
  } finally {
    await db.$client.end();
  }
  console.log(`Admin account set for ${email.data}. All existing sessions were revoked.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
