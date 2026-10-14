import { createSseParser } from "./sse";

export type ChatRole = "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  text: string;
}

/** Error codes from the bot (HTTP JSON body or SSE `error` event) plus client-side ones. */
export type ChatErrorCode =
  | "unavailable"
  | "rate_limited"
  | "busy"
  | "timeout"
  | "invalid_input"
  | "verification_failed"
  | "network";

export class ChatError extends Error {
  constructor(readonly code: ChatErrorCode) {
    super(code);
  }
}

// Limits mirror portfolio-bot's request schema (src/chat/input.ts).
const MAX_MESSAGES = 12;
const MAX_TEXT = 1000;
const MAX_TOTAL = 8000;
const KNOWN: readonly string[] = [
  "unavailable",
  "rate_limited",
  "busy",
  "timeout",
  "invalid_input",
  "verification_failed",
];

const toCode = (raw: unknown): ChatErrorCode =>
  typeof raw === "string" && KNOWN.includes(raw) ? (raw as ChatErrorCode) : "unavailable";

/** GET /v1/status with a hard timeout. Any failure counts as unavailable. */
export async function fetchAvailable(baseUrl: string, timeoutMs = 5000): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/v1/status`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return false;
    const body = (await res.json()) as { available?: unknown };
    return body.available === true;
  } catch {
    return false;
  }
}

/**
 * Fit history into the bot's limits: last N turns, each text capped, oldest dropped until the total fits,
 * and the conversation must start with the user (a leading assistant greeting is dropped).
 */
export function trimHistory(messages: readonly ChatMessage[]): ChatMessage[] {
  let out = messages
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, text: m.text.trim().slice(0, MAX_TEXT) }))
    .filter((m) => m.text.length > 0);
  while (out.length > 1 && out.reduce((n, m) => n + m.text.length, 0) > MAX_TOTAL)
    out = out.slice(1);
  while (out.length > 0 && out[0]?.role === "assistant") out = out.slice(1);
  return out;
}

/** POST /v1/chat and stream `delta` text to onDelta. Resolves on `done`, throws ChatError otherwise. */
export async function streamChat(opts: {
  baseUrl: string;
  messages: readonly ChatMessage[];
  turnstileToken?: string;
  signal: AbortSignal;
  onDelta: (text: string) => void;
  /** No bytes (not even the bot's 15 s `: ping`) for this long → give up with `timeout`. */
  idleMs?: number;
}): Promise<void> {
  const idle = new AbortController();
  const idleMs = opts.idleMs ?? 60_000;
  let reader: ReadableStreamDefaultReader<string> | null = null;
  // Abort the request AND cancel the reader: a pending read() is not always tied to the fetch signal.
  const onIdle = () => {
    idle.abort();
    void reader?.cancel().catch(() => {});
  };
  let idleTimer = setTimeout(onIdle, idleMs);
  const kick = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(onIdle, idleMs);
  };
  const signal = AbortSignal.any([opts.signal, idle.signal]);
  const fail = (err: unknown): never => {
    if (opts.signal.aborted) throw err;
    if (idle.signal.aborted) throw new ChatError("timeout");
    throw err instanceof ChatError ? err : new ChatError("network");
  };

  let res: Response;
  try {
    res = await fetch(`${opts.baseUrl}/v1/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: trimHistory(opts.messages),
        ...(opts.turnstileToken ? { turnstileToken: opts.turnstileToken } : {}),
      }),
      signal,
    });
  } catch (err) {
    clearTimeout(idleTimer);
    return fail(err);
  }

  if (!res.ok || !res.headers.get("content-type")?.startsWith("text/event-stream")) {
    clearTimeout(idleTimer);
    const body = (await res.json().catch(() => null)) as { error?: { code?: unknown } } | null;
    throw new ChatError(toCode(body?.error?.code));
  }
  if (!res.body) {
    clearTimeout(idleTimer);
    throw new ChatError("network");
  }

  reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  const parser = createSseParser();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      kick();
      for (const ev of parser.push(value)) {
        if (ev.event === "delta") {
          const { text } = JSON.parse(ev.data) as { text?: unknown };
          if (typeof text === "string") opts.onDelta(text);
        } else if (ev.event === "done") {
          return;
        } else if (ev.event === "error") {
          const { code } = JSON.parse(ev.data) as { code?: unknown };
          throw new ChatError(toCode(code));
        }
      }
    }
  } catch (err) {
    fail(err);
  } finally {
    clearTimeout(idleTimer);
    // Close the connection on every exit path (done, error event, parse failure).
    void reader.cancel().catch(() => {});
  }
  // Stream closed without `done`: went silent (idle) or was cut (proxy, pod restart).
  throw new ChatError(idle.signal.aborted ? "timeout" : "network");
}
