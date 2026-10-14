/**
 * Supabase serves every table in `public` through its Data API. RLS must be enabled on all of
 * them (no policies = no access for anon/authenticated), while the app's owner role still works.
 */
import { describe, expect, it } from "vitest";
import { useTestApp } from "./helpers.js";

const getT = useTestApp();

describe("row level security", () => {
  it("is enabled on every table in the public schema", async () => {
    const { rows } = await getT().ctx.db.$client.query<{
      relname: string;
      relrowsecurity: boolean;
    }>(
      `SELECT c.relname, c.relrowsecurity
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'`,
    );
    expect(rows.length).toBeGreaterThanOrEqual(14);
    expect(rows.filter((r) => !r.relrowsecurity).map((r) => r.relname)).toEqual([]);
  });

  it("denies a non-owner role without policies (as Supabase's anon role would be)", async () => {
    const { db } = getT().ctx;
    const client = await db.$client.connect();
    try {
      await client.query("BEGIN");
      await client.query("CREATE ROLE rls_probe NOLOGIN");
      await client.query("GRANT USAGE ON SCHEMA public TO rls_probe");
      await client.query("GRANT SELECT ON ALL TABLES IN SCHEMA public TO rls_probe");
      await client.query("SET LOCAL ROLE rls_probe");
      const { rows } = await client.query("SELECT key FROM site_sections");
      expect(rows).toEqual([]); // 9 rows exist; RLS hides all of them
      await client.query("RESET ROLE");
      const owner = await client.query("SELECT key FROM site_sections");
      expect(owner.rowCount).toBe(9);
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });
});
