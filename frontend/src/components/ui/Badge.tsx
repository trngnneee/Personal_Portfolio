import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "primary" | "accent";

const tones: Record<Tone, string> = {
  neutral: "border-neutral-700 bg-bg-elevated text-neutral-200",
  primary: "border-primary-800 bg-primary-500/10 text-primary-300",
  accent: "border-accent-700/60 bg-accent-500/10 text-accent-500",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
