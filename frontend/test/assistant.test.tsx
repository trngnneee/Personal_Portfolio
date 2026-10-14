import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchAvailable,
  streamChat,
  trimHistory,
  type ChatMessage,
} from "@/features/assistant/client";
import { createSseParser } from "@/features/assistant/sse";
import { site } from "./fixtures";
import { renderAt } from "./render";

const BOT = "https://bot.test";

/** An SSE response whose body arrives in the given raw chunks (boundaries anywhere). */
function sse(chunks: string[]): Response {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(c) {
        for (const ch of chunks) c.enqueue(enc.encode(ch));
        c.close();
      },
    }),
    { headers: { "content-type": "text/event-stream; charset=utf-8" } },
  );
}

const ev = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
const answer = (text: string) => sse([ev("delta", { text }), ev("done", {})]);

type BotHandler = (path: string, init?: RequestInit) => Response | Promise<Response>;

/** Real app + routes, with requests to the bot answered by `bot`. */
function renderWithBot(bot: BotHandler, path = "/") {
  vi.stubEnv("VITE_ASSISTANT_URL", BOT);
  vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "");
  const view = renderAt(path, site());
  const siteFetch = globalThis.fetch;
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) =>
    String(url).startsWith(BOT) ? bot(String(url).slice(BOT.length), init) : siteFetch(url, init),
  );
  return view;
}

/** Bot that is online and answers every chat request with `reply(body)`. */
function onlineBot(reply: (body: { messages: ChatMessage[] }) => Response) {
  return (path: string, init?: RequestInit) =>
    path === "/v1/status"
      ? Response.json({ available: true })
      : reply(JSON.parse(String(init?.body)) as { messages: ChatMessage[] });
}

async function openPanel(user = userEvent.setup()) {
  await user.click(await screen.findByRole("button", { name: "Ask Spidey" }));
  // First open lazy-loads the panel chunk (markdown renderer) — slow in jsdom.
  return screen.findByRole("dialog", { name: /SPIDEY/ }, { timeout: 10_000 });
}

async function ask(dialog: HTMLElement, text: string, user = userEvent.setup()) {
  const input = within(dialog).getByLabelText("Message Spidey");
  await user.type(input, text);
  await waitFor(() =>
    expect(within(dialog).getByRole("button", { name: "Send message" })).toBeEnabled(),
  );
  await user.keyboard("{Enter}");
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("sse parser", () => {
  it("handles events split at any byte, CRLF, multi-line data and ping comments", () => {
    const p = createSseParser();
    const raw =
      ': ping\r\n\r\nevent: delta\r\ndata: {"text":"a"}\r\n\r\nevent: delta\ndata: {"text":\ndata: "b"}\n\nevent: done\ndata: {}\n\n';
    const out = [...raw].flatMap((ch) => p.push(ch));
    expect(out).toEqual([
      { event: "delta", data: '{"text":"a"}' },
      { event: "delta", data: '{"text":\n"b"}' },
      { event: "done", data: "{}" },
    ]);
  });
});

describe("client", () => {
  it("trimHistory fits the bot's limits and starts with the user", () => {
    const long: ChatMessage[] = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 ? "assistant" : "user",
      text: "x".repeat(1500),
    }));
    const out = trimHistory([...long, { role: "user", text: "last?" }]);
    expect(out.length).toBeLessThanOrEqual(12);
    expect(out.every((m) => m.text.length <= 1000)).toBe(true);
    expect(out.reduce((n, m) => n + m.text.length, 0)).toBeLessThanOrEqual(8000);
    expect(out[0]?.role).toBe("user");
    expect(out.at(-1)).toEqual({ role: "user", text: "last?" });
  });

  it("fetchAvailable: false on network error, non-OK, bad body or timeout", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await fetchAvailable(BOT)).toBe(false);
    vi.stubGlobal("fetch", async () => new Response("oops", { status: 502 }));
    expect(await fetchAvailable(BOT)).toBe(false);
    vi.stubGlobal("fetch", async () => Response.json({ available: "yes" }));
    expect(await fetchAvailable(BOT)).toBe(false);
    vi.stubGlobal(
      "fetch",
      (_u: string, init?: RequestInit) =>
        new Promise((_r, reject) =>
          init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))),
        ),
    );
    expect(await fetchAvailable(BOT, 30)).toBe(false);
    vi.stubGlobal("fetch", async () => Response.json({ available: true }));
    expect(await fetchAvailable(BOT)).toBe(true);
  });

  it("streamChat: a stream that goes silent ends with `timeout` instead of hanging", async () => {
    const enc = new TextEncoder();
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(
          new ReadableStream({
            start(c) {
              c.enqueue(enc.encode(ev("delta", { text: "then silence" })));
            },
          }),
          { headers: { "content-type": "text/event-stream" } },
        ),
    );
    const got: string[] = [];
    await expect(
      streamChat({
        baseUrl: BOT,
        messages: [{ role: "user", text: "q" }],
        signal: new AbortController().signal,
        onDelta: (t) => got.push(t),
        idleMs: 50,
      }),
    ).rejects.toMatchObject({ code: "timeout" });
    expect(got).toEqual(["then silence"]);
  });

  it("streamChat: stream cut without `done` is an error, not a silent success", async () => {
    vi.stubGlobal("fetch", async () => sse([ev("delta", { text: "half" })]));
    await expect(
      streamChat({
        baseUrl: BOT,
        messages: [{ role: "user", text: "q" }],
        signal: new AbortController().signal,
        onDelta: () => {},
      }),
    ).rejects.toMatchObject({ code: "network" });
  });
});

describe("Spidey widget", () => {
  it("is not rendered when the build has no VITE_ASSISTANT_URL", async () => {
    renderAt("/", site());
    await screen.findByRole("navigation", { name: "Main" });
    expect(screen.queryByRole("button", { name: "Ask Spidey" })).toBeNull();
  });

  it("bot down → 'AI hiện không khả dụng', no online badge, the page keeps working", async () => {
    renderWithBot(async () => {
      throw new TypeError("Failed to fetch");
    }, "/skills");
    const dialog = await openPanel();
    expect(await within(dialog).findByText("AI hiện không khả dụng")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Message Spidey")).toBeNull();
    expect(screen.queryByText("AI available")).toBeNull();
    expect(await screen.findByRole("heading", { level: 1, name: "Skills" })).toBeInTheDocument();
  });

  it("offline → 'Retry connection' re-checks; the launcher only claims online once verified", async () => {
    let available = false;
    const user = userEvent.setup();
    renderWithBot((path) => (path === "/v1/status" ? Response.json({ available }) : answer("hi")));
    const dialog = await openPanel(user);
    expect(await within(dialog).findByText("AI hiện không khả dụng")).toBeInTheDocument();
    available = true;
    await user.click(within(dialog).getByRole("button", { name: "Retry connection" }));
    expect(await within(dialog).findByLabelText("Message Spidey")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Close Spidey" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByText("AI available")).toBeInTheDocument();
  });

  it("welcome state: suggestion card sends its prompt and streams a markdown answer", async () => {
    const bodies: { messages: ChatMessage[] }[] = [];
    const user = userEvent.setup();
    renderWithBot(
      onlineBot((body) => {
        bodies.push(body);
        const raw =
          ev("delta", { text: "## Stack\nNguyen dùng **Kubernetes** và `kubectl`." }) +
          ev("delta", {
            text: " ![x](https://evil.example/p.png)\n\n```bash\nkubectl get pods\n```\n",
          }) +
          ev("done", {});
        // Split mid-event and mid-JSON.
        return sse([raw.slice(0, 17), raw.slice(17, 60), raw.slice(60)]);
      }),
    );
    const dialog = await openPanel(user);
    expect(within(dialog).getByText(/Spidey — Nguyen's AI assistant/)).toBeInTheDocument();
    const card = within(dialog).getByRole("button", { name: /Tech stack/ });
    await waitFor(() => expect(card).toBeEnabled());
    await user.click(card);

    const log = within(dialog).getByRole("log");
    expect(log).toHaveAttribute("aria-live", "polite");
    await waitFor(() => expect(within(log).getByText("Kubernetes").tagName).toBe("STRONG"));
    expect(within(log).getByRole("heading", { name: "Stack" })).toBeInTheDocument();
    expect(log.querySelector("img")).toBeNull();
    expect(bodies).toEqual([
      { messages: [{ role: "user", text: "What technologies and tools does Nguyen work with?" }] },
    ]);
    // Welcome replaced by the conversation.
    expect(within(dialog).queryByRole("button", { name: /Tech stack/ })).toBeNull();

    // Code block: labelled with its language and copyable.
    await user.click(await within(log).findByRole("button", { name: "Copy code" }));
    expect(await navigator.clipboard.readText()).toBe("kubectl get pods");
    expect(within(log).getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(within(log).getByText("bash")).toBeInTheDocument();
  });

  it("Enter sends, Shift+Enter adds a line; history is text-only", async () => {
    const bodies: { messages: ChatMessage[] }[] = [];
    const user = userEvent.setup();
    renderWithBot(
      onlineBot((body) => {
        bodies.push(body);
        return answer(`reply ${bodies.length}`);
      }),
    );
    const dialog = await openPanel(user);
    const input = within(dialog).getByLabelText("Message Spidey");
    await waitFor(() => expect(input).toHaveFocus());
    await user.type(input, "line one{Shift>}{Enter}{/Shift}line two");
    expect(input).toHaveValue("line one\nline two");
    await user.keyboard("{Enter}");
    await within(dialog).findByText("reply 1");
    await ask(dialog, "and then?", user);
    await within(dialog).findByText("reply 2");
    expect(bodies[1]).toEqual({
      messages: [
        { role: "user", text: "line one\nline two" },
        { role: "assistant", text: "reply 1" },
        { role: "user", text: "and then?" },
      ],
    });
  });

  it("error event → inline alert; Retry re-asks the same question", async () => {
    let calls = 0;
    const user = userEvent.setup();
    renderWithBot(
      onlineBot(() =>
        ++calls === 1 ? sse([ev("error", { code: "busy" })]) : answer("Back online."),
      ),
    );
    const dialog = await openPanel(user);
    await ask(dialog, "Hello?", user);
    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent(/busy/);
    expect(within(dialog).getByText("Hello?")).toBeInTheDocument();
    await user.click(within(alert).getByRole("button", { name: "Retry" }));
    expect(await within(dialog).findByText("Back online.")).toBeInTheDocument();
    expect(within(dialog).queryByRole("alert")).toBeNull();
    expect(within(dialog).getAllByText("Hello?")).toHaveLength(1);
  });

  it("chat 503 unavailable mid-session → switches to the offline state", async () => {
    renderWithBot(
      onlineBot(() => Response.json({ error: { code: "unavailable" } }, { status: 503 })),
    );
    const dialog = await openPanel();
    await ask(dialog, "Hi");
    expect(await within(dialog).findByText("AI hiện không khả dụng")).toBeInTheDocument();
  });

  it("restart clears the conversation and shows the welcome state again", async () => {
    const user = userEvent.setup();
    renderWithBot(onlineBot(() => answer("Some answer.")));
    const dialog = await openPanel(user);
    const restart = within(dialog).getByRole("button", { name: "Restart conversation" });
    expect(restart).toBeDisabled();
    await ask(dialog, "Q?", user);
    await within(dialog).findByText("Some answer.");
    await user.click(restart);
    expect(within(dialog).queryByText("Some answer.")).toBeNull();
    expect(within(dialog).getByRole("button", { name: /About me/ })).toBeInTheDocument();
  });

  it("conversation survives closing and reopening the panel", async () => {
    const user = userEvent.setup();
    renderWithBot(onlineBot(() => answer("Kept.")));
    let dialog = await openPanel(user);
    await ask(dialog, "Remember me", user);
    await within(dialog).findByText("Kept.");
    await user.click(screen.getByRole("button", { name: "Hide Spidey" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    dialog = await openPanel(user);
    expect(within(dialog).getByText("Kept.")).toBeInTheDocument();
  });

  it("keyboard: focus moves in on open, Esc closes and returns focus to the launcher", async () => {
    const user = userEvent.setup();
    renderWithBot(onlineBot(() => answer("x")));
    const dialog = await openPanel(user);
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    const launcher = screen.getByRole("button", { name: "Ask Spidey" });
    expect(launcher).toHaveAttribute("aria-expanded", "false");
    expect(launcher).toHaveFocus();
  });
});
