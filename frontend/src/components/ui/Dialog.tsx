import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  /** Visually hide the title (still announced). */
  hideTitle?: boolean;
}

/**
 * Native <dialog> + showModal(): focus is trapped by the browser (the rest of the page
 * is inert), Esc closes, and focus returns to the opener on close.
 */
export function Dialog({ open, onClose, title, children, className, hideTitle }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // Click on the backdrop (the dialog element itself) closes.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "m-auto max-h-[90dvh] w-[min(56rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-neutral-800 bg-bg-surface p-0 text-neutral-100 shadow-glow",
        className,
      )}
    >
      {open && (
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2
              id={titleId}
              className={cn("font-mono text-xl font-bold text-neutral-50", hideTitle && "sr-only")}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded p-1 text-neutral-300 hover:bg-bg-elevated hover:text-neutral-50"
              aria-label="Close dialog"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
