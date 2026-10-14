import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import i18n from "@/i18n";
import { writeToken } from "@/lib/api";
import { queryClient } from "@/lib/query-client";

type Handler = (url: string, init?: RequestInit) => Response | undefined;

function mockApi(handler: Handler) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async (url: string, init?: RequestInit) =>
        handler(String(url), init) ?? Response.json({ items: [] }),
    ),
  );
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
  queryClient.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  window.history.pushState({}, "", "/");
});

describe("auth guard", () => {
  it("redirects to /login when signed out", async () => {
    mockApi(() => undefined);
    window.history.pushState({}, "", "/projects");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/login");
  });

  it("shows the lockout message from a 423", async () => {
    mockApi((url) =>
      url.endsWith("/auth/login")
        ? Response.json(
            {
              error: {
                code: "locked",
                message: "locked",
                details: { lockedUntil: "2026-10-14T10:00:00.000Z" },
              },
            },
            { status: 423 },
          )
        : undefined,
    );
    window.history.pushState({}, "", "/login");
    render(<App />);
    await userEvent.type(await screen.findByLabelText(/Email/), "admin@example.com");
    await userEvent.type(screen.getByLabelText(/Password/), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText(/Too many failed attempts/)).toBeInTheDocument();
  });

  it("does not submit invalid credentials and shows field errors", async () => {
    const calls = vi.fn();
    mockApi((url) => {
      calls(url);
      return undefined;
    });
    window.history.pushState({}, "", "/login");
    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(calls).not.toHaveBeenCalledWith(expect.stringContaining("/auth/login"));
  });
});

describe("signed in", () => {
  beforeEach(() => {
    writeToken({ token: "t", expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
  });

  it("lists projects from the API inside the shell", async () => {
    mockApi((url) => {
      if (url.endsWith("/auth/me"))
        return Response.json({
          email: "me@example.com",
          lastLoginAt: null,
          passwordChangedAt: null,
        });
      if (url.endsWith("/projects"))
        return Response.json({
          items: [
            {
              id: 1,
              slug: "homelab",
              title: "Kubernetes Homelab",
              subtitle: null,
              summary: "s",
              description: "",
              highlights: [],
              role: null,
              category: "homelab",
              techStack: ["Kubernetes"],
              repoUrl: null,
              repoVisibility: "private",
              demoUrl: null,
              coverMediaId: null,
              cover: null,
              featured: true,
              startDate: null,
              endDate: null,
              sortOrder: 0,
              published: false,
              updatedAt: "2026-10-14T00:00:00.000Z",
            },
          ],
        });
      return undefined;
    });
    window.history.pushState({}, "", "/projects");
    render(<App />);
    expect(await screen.findByText("Kubernetes Homelab")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Projects", level: 2 })).toBeInTheDocument();
    expect(screen.getAllByText("Hidden").length).toBeGreaterThan(0);
  });

  it("drops the session when the API answers 401", async () => {
    mockApi((url) =>
      url.includes("/admin/")
        ? Response.json({ error: { code: "unauthorized", message: "x" } }, { status: 401 })
        : undefined,
    );
    window.history.pushState({}, "", "/dashboard");
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe("/login"));
    expect(sessionStorage.getItem("portfolio-admin.token")).toBeNull();
  });
});
