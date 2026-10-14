import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createAdminRouter } from "../src/modules/admin.router.js";
import { ADMIN_EMAIL, ADMIN_PASSWORD, useTestApp, login, type TestApp } from "./helpers.js";

const getT = useTestApp();

type Method = "get" | "post" | "put" | "patch" | "delete";

/** Every route registered behind requireAuth, read from the live router. */
function protectedRoutes(t: TestApp): { method: Method; path: string }[] {
  const { protectedRoutes } = createAdminRouter(t.ctx);
  const out: { method: Method; path: string }[] = [];
  for (const layer of protectedRoutes.stack) {
    const route = layer.route as { path: string; methods: Record<string, boolean> } | undefined;
    if (!route) continue;
    for (const method of Object.keys(route.methods)) {
      out.push({ method: method as Method, path: route.path.replace(/:(\w+)/g, "1") });
    }
  }
  return out;
}

describe("admin auth guard", () => {
  let t: TestApp;
  beforeEach(() => {
    t = getT();
  });

  it("covers a meaningful route table", () => {
    const routes = protectedRoutes(t);
    expect(routes.length).toBeGreaterThan(40);
    expect(routes.some((r) => r.path === "/projects/reorder")).toBe(true);
    expect(routes.some((r) => r.path === "/auth/login")).toBe(false);
  });

  it("rejects every protected route without a token", async () => {
    for (const { method, path } of protectedRoutes(t)) {
      const res = await request(t.app)[method](`/api/v1/admin${path}`).send({});
      expect(res.status, `${method.toUpperCase()} ${path}`).toBe(401);
    }
  });

  it("rejects a token with a bad signature", async () => {
    const token = await login(t);
    const [h, p] = token.split(".");
    const forged = `${h}.${p}.${"A".repeat(43)}`;
    const res = await request(t.app)
      .get("/api/v1/admin/auth/me")
      .set("Authorization", `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    await login(t);
    const nineHoursAgo = Math.floor(Date.now() / 1000) - 9 * 3600;
    const { token } = await t.ctx.jwt.sign(1, nineHoursAgo);
    const res = await request(t.app)
      .get("/api/v1/admin/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("accepts a valid token", async () => {
    const token = await login(t);
    const res = await request(t.app)
      .get("/api/v1/admin/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(ADMIN_EMAIL);
  });

  it("kills old tokens after logout-all", async () => {
    const token = await login(t);
    const auth = { Authorization: `Bearer ${token}` };
    expect((await request(t.app).post("/api/v1/admin/auth/logout-all").set(auth)).status).toBe(204);
    expect((await request(t.app).get("/api/v1/admin/auth/me").set(auth)).status).toBe(401);
  });

  it("kills old tokens after change-password and requires the current password", async () => {
    const token = await login(t);
    const auth = { Authorization: `Bearer ${token}` };
    const wrong = await request(t.app)
      .post("/api/v1/admin/auth/change-password")
      .set(auth)
      .send({ currentPassword: "nope", newPassword: "another-long-password" });
    expect(wrong.status).toBe(400);

    const ok = await request(t.app)
      .post("/api/v1/admin/auth/change-password")
      .set(auth)
      .send({ currentPassword: ADMIN_PASSWORD, newPassword: "another-long-password" });
    expect(ok.status).toBe(204);
    expect((await request(t.app).get("/api/v1/admin/auth/me").set(auth)).status).toBe(401);

    const relogin = await request(t.app)
      .post("/api/v1/admin/auth/login")
      .send({ email: ADMIN_EMAIL, password: "another-long-password" });
    expect(relogin.status).toBe(200);
  });
});

describe("login", () => {
  let t: TestApp;
  beforeEach(async () => {
    t = getT();
    await login(t);
  });

  const attempt = (password: string, email = ADMIN_EMAIL) =>
    request(t.app).post("/api/v1/admin/auth/login").send({ email, password });

  it("uses one generic message for wrong email and wrong password", async () => {
    const a = await attempt("wrong-password");
    const b = await attempt(ADMIN_PASSWORD, "someone@else.com");
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.error.message).toBe("Invalid credentials");
    expect(b.body.error.message).toBe("Invalid credentials");
  });

  it("locks after 5 consecutive failures, even for the right password", async () => {
    for (let i = 0; i < 5; i++) expect((await attempt("wrong-password")).status).toBe(401);
    const locked = await attempt(ADMIN_PASSWORD);
    expect(locked.status).toBe(423);
    expect(locked.body.error.details.lockedUntil).toBeTypeOf("string");
  });

  it("resets the failure counter on success", async () => {
    for (let i = 0; i < 4; i++) await attempt("wrong-password");
    expect((await attempt(ADMIN_PASSWORD)).status).toBe(200);
    // Would lock on the 5th failure if the counter had not been reset (10 req budget incl. beforeEach).
    for (let i = 0; i < 3; i++) await attempt("wrong-password");
    expect((await attempt(ADMIN_PASSWORD)).status).toBe(200);
  });

  it("rate limits after 10 requests per IP", async () => {
    // beforeEach already used 1 of the 10 allowed requests.
    const statuses: number[] = [];
    for (let i = 0; i < 10; i++) statuses.push((await attempt(ADMIN_PASSWORD)).status);
    expect(statuses.at(-1)).toBe(429);
  });
});
