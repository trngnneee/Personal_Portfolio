import { RotateCcw, X } from "lucide-react";
import type { Ref } from "react";
import { cn } from "@/lib/cn";
import { SpideyIcon } from "./SpideyIcon";
import type { Availability } from "./useSpidey";

const STATUS: Record<Availability, { label: string; dot: string } | null> = {
  unknown: null,
  checking: { label: "Connecting", dot: "bg-spidey-muted" },
  available: { label: "Online", dot: "bg-spidey-green" },
  unavailable: { label: "Offline", dot: "bg-spidey-danger" },
};

const iconButton =
  "grid size-10 place-items-center rounded-lg text-spidey-muted transition-colors duration-150 hover:bg-spidey-raised hover:text-spidey-text disabled:pointer-events-none disabled:opacity-40 sm:size-8";

export function SpideyHeader({
  titleId,
  availability,
  canRestart,
  onRestart,
  onClose,
  closeRef,
}: {
  titleId: string;
  availability: Availability;
  canRestart: boolean;
  onRestart: () => void;
  onClose: () => void;
  closeRef: Ref<HTMLButtonElement>;
}) {
  const status = STATUS[availability];
  return (
    <header className="flex items-center gap-2 sm:gap-3 border-b border-spidey-border bg-spidey-surface px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:pt-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-spidey-green/25 bg-spidey-green/5 text-spidey-green max-[379px]:hidden">
        <SpideyIcon className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="truncate font-mono text-[13px] font-semibold tracking-wider">
          TRNGNNEEE <span className="text-spidey-muted">/</span> SPIDEY
        </h2>
        <p className="flex items-center gap-1.5 truncate font-mono text-[11px] text-spidey-muted">
          {status && (
            <>
              <span
                className={cn("size-1.5 shrink-0 rounded-full", status.dot)}
                aria-hidden="true"
              />
              <span className="sr-only">{status.label} · </span>
            </>
          )}
          DevOps · SRE · Engineering
        </p>
      </div>
      <button
        type="button"
        onClick={onRestart}
        disabled={!canRestart}
        className={iconButton}
        aria-label="Restart conversation"
        title="Restart conversation"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
      </button>
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className={iconButton}
        aria-label="Close Spidey"
        title="Close (Esc)"
      >
        <X className="size-4.5" aria-hidden="true" />
      </button>
    </header>
  );
}
