import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-mono text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const variants: Record<Variant, string> = {
  primary: "bg-primary-500 text-bg-page hover:bg-primary-400 hover:shadow-glow",
  outline:
    "border border-primary-700 text-primary-400 hover:border-primary-500 hover:bg-primary-500/10",
  ghost: "text-neutral-300 hover:bg-bg-elevated hover:text-neutral-50",
};

const buttonClass = (variant: Variant = "primary", className?: string) =>
  cn(base, variants[variant], className);

interface Common {
  variant?: Variant;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant,
  icon,
  children,
  className,
  ...rest
}: Common & ComponentProps<"button">) {
  return (
    <button type="button" className={buttonClass(variant, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

/** Internal navigation. */
export function ButtonLink({
  variant,
  icon,
  children,
  className,
  ...rest
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass(variant, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

/** External link, opened in a new tab. */
export function ButtonAnchor({
  variant,
  icon,
  children,
  className,
  ...rest
}: Common & ComponentProps<"a">) {
  return (
    <a
      className={buttonClass(variant, className)}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
    >
      {icon}
      {children}
    </a>
  );
}
