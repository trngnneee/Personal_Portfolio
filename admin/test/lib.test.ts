import { loginSchema, projectSchema } from "@portfolio/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import { onUnauthorized, readToken, request, writeToken } from "@/lib/api";
import { moveId } from "@/lib/resource";
import { fieldErrors, lines, orNull } from "@/lib/validation";

afterEach(() => vi.unstubAllGlobals());

describe("fieldErrors", () => {
  it("maps zod issues to translated messages, first issue per field", async () => {
    await i18n.changeLanguage("en");
    const errors = fieldErrors(loginSchema.safeParse({ email: "nope", password: "" }), i18n.t);
    expect(errors).toEqual({
      email: "Enter a valid email address.",
      password: "This field is required.",
    });
  });

  it("translates to Vietnamese", async () => {
    await i18n.changeLanguage("vi");
    const errors = fieldErrors(
      projectSchema.safeParse({ slug: "Bad Slug", title: "", summary: "x", category: "nope" }),
      i18n.t,
    );
    expect(errors.title).toBe("Trường này là bắt buộc.");
    expect(errors.slug).toBe("Sai định dạng.");
    expect(errors.category).toBe("Hãy chọn một giá trị.");
    await i18n.changeLanguage("en");
  });

  it("helpers normalise list and optional inputs", () => {
    expect(lines(" a \n\n b\n")).toEqual(["a", "b"]);
    expect(orNull("   ")).toBeNull();
    expect(moveId([1, 2, 3], 3, 1)).toBeNull();
    expect(moveId([1, 2, 3], 3, -1)).toEqual([1, 3, 2]);
  });
});

describe("api client", () => {
  it("sends the bearer token and clears the session on 401", async () => {
    writeToken({ token: "abc", expiresAt: new Date(Date.now() + 60_000).toISOString() });
    const seen: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        seen.push((init.headers as Record<string, string>).Authorization ?? "");
        return Response.json(
          { error: { code: "unauthorized", message: "Unauthorized" } },
          { status: 401 },
        );
      }),
    );
    const listener = vi.fn();
    const off = onUnauthorized(listener);
    await expect(request("/auth/me")).rejects.toMatchObject({ status: 401 });
    off();
    expect(seen).toEqual(["Bearer abc"]);
    expect(listener).toHaveBeenCalledOnce();
    expect(readToken()).toBeNull();
  });

  it("does not treat a failed login as an expired session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { error: { code: "unauthorized", message: "Invalid credentials" } },
          { status: 401 },
        ),
      ),
    );
    const listener = vi.fn();
    const off = onUnauthorized(listener);
    await expect(
      request("/auth/login", { method: "POST", body: {}, isAuthRequest: true }),
    ).rejects.toMatchObject({ status: 401 });
    off();
    expect(listener).not.toHaveBeenCalled();
  });

  it("ignores an expired stored token", () => {
    writeToken({ token: "old", expiresAt: new Date(Date.now() - 1000).toISOString() });
    expect(readToken()).toBeNull();
  });
});
