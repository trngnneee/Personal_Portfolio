import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { site } from "./fixtures";
import { renderAt } from "./render";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("section gating", () => {
  it("hides a disabled section from the nav and 404s its route", async () => {
    renderAt("/activities", site(["blog", "activities"]));
    expect(await screen.findByRole("heading", { name: /404/ })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).queryByRole("link", { name: "Activities" })).toBeNull();
    expect(within(nav).getByRole("link", { name: "Skills" })).toBeInTheDocument();
  });

  it("renders an enabled section and marks it current in the nav", async () => {
    renderAt("/skills", site());
    expect(await screen.findByRole("heading", { level: 1, name: "Skills" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Skills" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("shows command-not-found for unknown paths", async () => {
    renderAt("/nope", site());
    expect(await screen.findByText(/No such file or directory/)).toBeInTheDocument();
  });
});

describe("skills terminal", () => {
  it("runs commands and announces output", async () => {
    renderAt("/skills", site());
    const input = await screen.findByLabelText(/Enter a command/);
    await userEvent.type(input, "ls{Enter}");
    const log = screen.getByRole("log");
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(within(log).getByText(/cloud_devops\//)).toBeInTheDocument();
  });
});

describe("contact form", () => {
  it("shows accessible errors and does not submit invalid input", async () => {
    const posts: unknown[] = [];
    renderAt("/contact", site(), (body) => {
      posts.push(body);
      return Response.json({ ok: true }, { status: 201 });
    });
    await userEvent.click(await screen.findByRole("button", { name: /send message/i }));
    const name = screen.getByLabelText("Name");
    await waitFor(() => expect(name).toHaveAttribute("aria-invalid", "true"));
    const errorId = name.getAttribute("aria-describedby")!;
    expect(document.getElementById(errorId)?.textContent).toBeTruthy();
    expect(posts).toHaveLength(0);
  });

  it("submits valid input with an empty honeypot", async () => {
    const posts: Record<string, unknown>[] = [];
    renderAt("/contact", site(), (body) => {
      posts.push(body as Record<string, unknown>);
      return Response.json({ ok: true }, { status: 201 });
    });
    await userEvent.type(await screen.findByLabelText("Name"), "Alice");
    await userEvent.type(screen.getByLabelText("Email"), "alice@example.com");
    await userEvent.type(screen.getByLabelText("Subject"), "Hello there");
    await userEvent.type(screen.getByLabelText("Message"), "Let's build something together.");
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]).toMatchObject({ name: "Alice", website: "" });
    expect(await screen.findByRole("status", { name: "" })).toBeDefined();
  });
});
