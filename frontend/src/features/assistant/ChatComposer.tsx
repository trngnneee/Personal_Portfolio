import { ArrowUp, Square } from "lucide-react";
import {
  useId,
  useLayoutEffect,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/lib/cn";

const MAX = 1000;

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  streaming,
  canSend,
  hint,
  inputRef,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  streaming: boolean;
  /** Bot reachable + verified + not empty. Typing stays possible regardless. */
  canSend: boolean;
  /** Status line under the input (e.g. "Verifying your browser…"). */
  hint?: string;
  inputRef: Ref<HTMLTextAreaElement> & { current: HTMLTextAreaElement | null };
  /** Turnstile slot. */
  children?: ReactNode;
}) {
  const id = useId();
  const hintId = useId();

  // Auto-grow up to ~6 lines.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    // Empty: one line. Measuring would size the box for a placeholder that wraps on narrow screens.
    if (value) el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [value, inputRef]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (canSend) onSubmit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!streaming) submit();
    }
  };

  return (
    <form
      onSubmit={submit}
      className="border-t border-spidey-border bg-spidey-surface px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-end gap-2 rounded-xl border border-spidey-border bg-spidey-bg py-1.5 pr-1.5 pl-3 transition-colors duration-150 focus-within:border-spidey-green/45">
        <span className="pb-1.5 font-mono text-sm text-spidey-green select-none" aria-hidden="true">
          ❯
        </span>
        <label htmlFor={id} className="sr-only">
          Message Spidey
        </label>
        <textarea
          id={id}
          ref={inputRef}
          rows={1}
          maxLength={MAX}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about my projects..."
          aria-describedby={hintId}
          className="max-h-36 min-h-7 flex-1 resize-none bg-transparent py-1 font-mono text-base leading-relaxed text-spidey-text outline-none placeholder:truncate placeholder:text-spidey-muted/70 sm:text-[13px]"
        />
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-spidey-border-strong text-spidey-text transition-colors duration-150 hover:bg-spidey-raised sm:size-8"
            aria-label="Stop generating"
          >
            <Square className="size-3.5 fill-current" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-lg transition-colors duration-150 sm:size-8",
              canSend
                ? "bg-spidey-green text-spidey-bg hover:bg-spidey-green/85"
                : "cursor-not-allowed bg-spidey-raised text-spidey-muted",
            )}
            aria-label="Send message"
          >
            <ArrowUp className="size-4" strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
      </div>
      <p
        id={hintId}
        className="mt-1.5 flex justify-between gap-2 px-1 font-mono text-[10.5px] text-spidey-muted"
      >
        <span>{hint ?? "Enter to send · Shift+Enter for a new line"}</span>
        {value.length > MAX - 200 && (
          <span>
            {value.length}/{MAX}
          </span>
        )}
      </p>
      {children}
    </form>
  );
}
