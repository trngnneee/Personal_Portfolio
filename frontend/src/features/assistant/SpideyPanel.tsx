import { AlertTriangle, ArrowDown, PlugZap, RotateCw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router";
import { ROUTES } from "@/config/routes";
import { ChatComposer } from "./ChatComposer";
import { ChatMessage } from "./ChatMessage";
import { SpideyHeader } from "./SpideyHeader";
import { SpideyWelcome } from "./SpideyWelcome";
import { Turnstile } from "./Turnstile";
import type { Spidey } from "./useSpidey";

export const UNAVAILABLE_TEXT = "AI hiện không khả dụng";

type PanelProps = {
  id: string;
  spidey: Spidey;
  turnstileSiteKey: string;
  onClose: () => void;
};

/**
 * Lazy entry point. Owns AnimatePresence so the animation engine ships in this chunk, not the main
 * bundle; stays mounted after the first open so the exit animation can play.
 */
export function SpideyPanelHost({ open, ...props }: PanelProps & { open: boolean }) {
  return <AnimatePresence>{open && <SpideyPanel key="spidey" {...props} />}</AnimatePresence>;
}

/**
 * Non-modal floating panel (desktop) / full-screen sheet (mobile). Non-modal on purpose: the portfolio
 * stays visible and usable behind it, so there is no focus trap and no close-on-outside-click (which
 * would throw away a half-typed question). Esc closes; focus returns to the launcher.
 */
function SpideyPanel({ id, spidey, turnstileSiteKey, onClose }: PanelProps) {
  const { availability, messages, streaming, error, check, send, retry, stop, reset } = spidey;
  const reduce = useReducedMotion();
  const titleId = useId();
  const [draft, setDraft] = useState("");

  // ---- Turnstile: token is reused for the conversation; a rejected token is replaced + retried once.
  const needsToken = turnstileSiteKey !== "";
  const [token, setToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [turnstileFailed, setTurnstileFailed] = useState(false);
  const retryOnToken = useRef(false);
  const verifying = needsToken && !token && !turnstileFailed;

  const afterResult = (code: string | null) => {
    // Without a site key there is no Turnstile to produce a new token: nothing to wait for.
    if (code === "verification_failed" && needsToken) {
      retryOnToken.current = true;
      setTurnstileReset((n) => n + 1);
    }
  };

  // ---- Scrolling: follow the stream only while the reader is at the bottom.
  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 64;
    stick.current = atBottom;
    setShowJump(!atBottom);
  };
  const toBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    stick.current = true;
    setShowJump(false);
    el.scrollTo?.({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  };
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages, error]);

  // ---- Focus: into the composer on open (or the close button when there is nothing to type into).
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (rootRef.current?.contains(document.activeElement)) return;
    (availability === "unavailable" ? closeRef.current : inputRef.current)?.focus();
  }, [availability]);

  const ready = availability === "available" && !verifying;
  const submitText = async (text: string) => {
    if (!ready || streaming || !text.trim()) return;
    stick.current = true;
    setDraft("");
    afterResult(await send(text, token ?? undefined));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !e.nativeEvent.isComposing) {
      e.stopPropagation();
      onClose();
    }
  };

  const hint =
    availability === "checking" || availability === "unknown"
      ? "Connecting to Spidey…"
      : verifying
        ? "Verifying your browser…"
        : undefined;

  return (
    <motion.div
      ref={rootRef}
      id={id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      initial={{ opacity: 0, y: reduce ? 0 : 16, scale: reduce ? 1 : 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: reduce ? 0 : 16, scale: reduce ? 1 : 0.98 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      style={{ transformOrigin: "bottom right" }}
      className="fixed inset-0 z-50 flex h-dvh flex-col overflow-hidden bg-spidey-bg text-spidey-text sm:inset-auto sm:right-5 sm:bottom-24 sm:h-[600px] sm:max-h-[calc(100dvh-100px)] sm:w-[420px] sm:rounded-2xl sm:border sm:border-spidey-border sm:shadow-spidey"
    >
      <SpideyHeader
        titleId={titleId}
        availability={availability}
        canRestart={messages.length > 0 || error !== null}
        onRestart={() => {
          reset();
          setDraft("");
          stick.current = true;
          inputRef.current?.focus();
        }}
        onClose={onClose}
        closeRef={closeRef}
      />

      {availability === "unavailable" ? (
        <div
          role="status"
          className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <span className="grid size-12 place-items-center rounded-xl border border-spidey-danger/30 bg-spidey-danger/5 text-spidey-danger">
            <PlugZap className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-mono text-sm font-semibold text-spidey-text">{UNAVAILABLE_TEXT}</p>
            <p className="mt-2 text-sm leading-relaxed text-spidey-muted">
              Spidey is offline right now. Everything else on the site works as usual — or reach out
              via the{" "}
              <Link
                to={ROUTES.contact}
                onClick={onClose}
                className="text-spidey-cyan underline underline-offset-3"
              >
                contact page
              </Link>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={() => void check()}
            className="inline-flex items-center gap-2 rounded-lg border border-spidey-border-strong px-3 py-2 font-mono text-xs text-spidey-text transition-colors duration-150 hover:border-spidey-green/50"
          >
            <RotateCw className="size-3.5" aria-hidden="true" />
            Retry connection
          </button>
        </div>
      ) : (
        <>
          <div className="relative min-h-0 flex-1">
            <div
              ref={scrollRef}
              onScroll={onScroll}
              role="log"
              aria-live="polite"
              aria-busy={streaming}
              aria-label="Conversation with Spidey"
              className="h-full space-y-5 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-5"
            >
              {messages.length === 0 ? (
                <SpideyWelcome disabled={!ready || streaming} onPick={(p) => void submitText(p)} />
              ) : (
                messages.map((m) => <ChatMessage key={m.id} message={m} />)
              )}
              {error && (
                <div
                  role="alert"
                  className="ml-10 flex items-start gap-2.5 rounded-lg border border-spidey-danger/25 bg-spidey-danger/5 px-3 py-2.5"
                >
                  <AlertTriangle
                    className="mt-0.5 size-3.5 shrink-0 text-spidey-danger"
                    aria-hidden="true"
                  />
                  <p className="flex-1 text-xs leading-relaxed text-spidey-text">
                    {error.code === "verification_failed" && !needsToken
                      ? "Spidey couldn't verify this browser. Please try again later."
                      : error.message}
                  </p>
                  {error.retryable && (
                    <button
                      type="button"
                      onClick={() => void retry(token ?? undefined).then(afterResult)}
                      disabled={streaming || !ready}
                      className="shrink-0 rounded-md border border-spidey-border-strong px-2 py-1 font-mono text-[11px] text-spidey-text transition-colors duration-150 hover:border-spidey-green/50 disabled:opacity-50"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>
            {showJump && messages.length > 0 && (
              <button
                type="button"
                onClick={toBottom}
                className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-spidey-border-strong bg-spidey-raised px-3 py-1.5 font-mono text-[11px] text-spidey-text shadow-spidey transition-colors duration-150 hover:border-spidey-cyan/50"
              >
                <ArrowDown className="size-3" aria-hidden="true" />
                Latest
              </button>
            )}
          </div>

          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSubmit={() => void submitText(draft)}
            onStop={stop}
            streaming={streaming}
            canSend={ready && !streaming && draft.trim() !== ""}
            hint={hint}
            inputRef={inputRef}
          >
            {needsToken && (
              <Turnstile
                siteKey={turnstileSiteKey}
                resetKey={turnstileReset}
                onToken={(t) => {
                  setToken(t);
                  if (!t) return;
                  setTurnstileFailed(false);
                  if (retryOnToken.current) {
                    retryOnToken.current = false;
                    void retry(t).then(afterResult);
                  }
                }}
                onError={() => setTurnstileFailed(true)}
              />
            )}
          </ChatComposer>
        </>
      )}
    </motion.div>
  );
}
