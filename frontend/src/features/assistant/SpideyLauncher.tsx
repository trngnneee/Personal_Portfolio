import { X } from "lucide-react";
import { SpideyIcon } from "./SpideyIcon";
import type { Ref } from "react";
import { cn } from "@/lib/cn";
import type { Availability } from "./useSpidey";

/** Floating `>_` button. Turns into the close control while the panel is open (desktop). */
export function SpideyLauncher({
  ref,
  open,
  availability,
  panelId,
  onToggle,
}: {
  ref: Ref<HTMLButtonElement>;
  open: boolean;
  availability: Availability;
  panelId: string;
  onToggle: () => void;
}) {
  const label = open ? "Hide Spidey" : "Ask Spidey";
  return (
    <div
      className={cn(
        "group fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 sm:right-5 sm:bottom-5",
        // Mobile: the panel is full-screen with its own close button.
        open && "max-sm:hidden",
      )}
    >
      <button
        ref={ref}
        type="button"
        onClick={onToggle}
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={cn(
          "relative grid size-14 place-items-center rounded-2xl border bg-spidey-surface text-spidey-green transition-[transform,border-color,box-shadow] duration-150 ease-out sm:size-15",
          "hover:-translate-y-0.5 hover:border-spidey-green/60 hover:shadow-spidey-glow focus-visible:outline-spidey-green",
          open ? "border-spidey-green/50" : "border-spidey-green/30 shadow-spidey",
        )}
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <SpideyIcon className="size-6" />}
        {/* Only claims "online" after /v1/status actually said so. */}
        {availability === "available" && !open && (
          <span className="absolute top-2 right-2 size-2 rounded-full bg-spidey-green ring-2 ring-spidey-surface">
            <span className="sr-only">AI available</span>
          </span>
        )}
      </button>
      {!open && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-full mr-3 -translate-y-1/2 rounded-md border border-spidey-border bg-spidey-raised px-2.5 py-1.5 font-mono text-xs whitespace-nowrap text-spidey-text opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 max-sm:hidden"
        >
          Ask Spidey
        </span>
      )}
    </div>
  );
}
