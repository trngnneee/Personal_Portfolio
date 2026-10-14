import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChatError,
  fetchAvailable,
  streamChat,
  type ChatErrorCode,
  type ChatMessage,
} from "./client";

export type Availability = "unknown" | "checking" | "available" | "unavailable";

export interface SpideyMessage extends ChatMessage {
  id: number;
}

export interface SpideyError {
  code: Exclude<ChatErrorCode, "unavailable">;
  message: string;
  /** false → the widget recovers by itself (e.g. Turnstile re-verification). */
  retryable: boolean;
}

const ERRORS: Record<SpideyError["code"], Omit<SpideyError, "code">> = {
  rate_limited: {
    message: "Too many messages in a short time. Wait a few minutes, then retry.",
    retryable: true,
  },
  busy: { message: "Spidey is busy right now. Try again in a few seconds.", retryable: true },
  timeout: { message: "The response took too long.", retryable: true },
  invalid_input: {
    message: "That message couldn't be sent (too long or invalid).",
    retryable: false,
  },
  verification_failed: {
    message: "Verifying your browser — retrying automatically…",
    retryable: false,
  },
  network: { message: "Lost the connection to Spidey.", retryable: true },
};

let nextId = 1;

/**
 * Conversation state for the widget. Lives above the (lazy, animated) panel so closing the panel
 * neither loses the conversation nor stops an answer that is still streaming.
 * History is in memory only — nothing is persisted.
 */
export function useSpidey(baseUrl: string) {
  const [availability, setAvailability] = useState<Availability>("unknown");
  const [messages, setMessages] = useState<SpideyMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<SpideyError | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false); // guards double submits before React re-renders

  useEffect(() => () => abortRef.current?.abort(), []);

  const check = useCallback(async () => {
    setAvailability("checking");
    setAvailability((await fetchAvailable(baseUrl)) ? "available" : "unavailable");
  }, [baseUrl]);

  /** Stream an answer for `history` (which ends with the user's turn). Resolves to the error code or null. */
  const run = useCallback(
    async (history: SpideyMessage[], token?: string): Promise<ChatErrorCode | null> => {
      const reply: SpideyMessage = { id: nextId++, role: "assistant", text: "" };
      setMessages([...history, reply]);
      setError(null);
      setStreaming(true);
      busyRef.current = true;
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        await streamChat({
          baseUrl,
          messages: history,
          turnstileToken: token,
          signal: ac.signal,
          onDelta: (d) =>
            setMessages((ms) =>
              ms.map((m) => (m.id === reply.id ? { ...m, text: m.text + d } : m)),
            ),
        });
        return null;
      } catch (err) {
        if (ac.signal.aborted) return null;
        const code: ChatErrorCode = err instanceof ChatError ? err.code : "network";
        // Keep the question (so Retry can resend it); drop an empty reply placeholder.
        setMessages((ms) => ms.filter((m) => m.id !== reply.id || m.text !== ""));
        if (code === "unavailable") setAvailability("unavailable");
        else setError({ code, ...ERRORS[code] });
        return code;
      } finally {
        if (abortRef.current === ac) {
          abortRef.current = null;
          busyRef.current = false;
          setStreaming(false);
        }
      }
    },
    [baseUrl],
  );

  const send = useCallback(
    (text: string, token?: string) => {
      const q = text.trim();
      if (!q || busyRef.current) return Promise.resolve(null);
      return run([...messages, { id: nextId++, role: "user", text: q }], token);
    },
    [messages, run],
  );

  /** Re-ask the last question: drops whatever (partial) answer followed it. */
  const retry = useCallback(
    (token?: string) => {
      if (busyRef.current) return Promise.resolve(null);
      const lastUser = messages.findLastIndex((m) => m.role === "user");
      if (lastUser === -1) return Promise.resolve(null);
      return run(messages.slice(0, lastUser + 1), token);
    },
    [messages, run],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    busyRef.current = false;
    setStreaming(false);
    setMessages([]);
    setError(null);
  }, []);

  return { availability, messages, streaming, error, check, send, retry, stop, reset };
}

export type Spidey = ReturnType<typeof useSpidey>;
