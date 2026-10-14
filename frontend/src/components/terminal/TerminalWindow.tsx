import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Window chrome with traffic-light dots and a title bar. */
export function TerminalWindow({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-neutral-800 bg-bg-surface",
        className,
      )}
    >
      <div
        className="flex items-center gap-2 border-b border-neutral-800 bg-bg-elevated px-4 py-2"
        aria-hidden="true"
      >
        <span className="size-3 rounded-full bg-danger-500/80" />
        <span className="size-3 rounded-full bg-accent-500/80" />
        <span className="size-3 rounded-full bg-primary-600/80" />
        <span className="ml-2 truncate font-mono text-xs text-neutral-400">{title}</span>
      </div>
      {children}
    </div>
  );
}
