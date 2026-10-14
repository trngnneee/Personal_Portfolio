import { Check, Copy } from "lucide-react";
import { isValidElement, useEffect, useState, type ReactNode } from "react";

const textOf = (node: ReactNode): string =>
  typeof node === "string"
    ? node
    : Array.isArray(node)
      ? node.map(textOf).join("")
      : isValidElement<{ children?: ReactNode }>(node)
        ? textOf(node.props.children)
        : "";

/** Replaces markdown `<pre>`: language label + copy button. Highlighting comes from rehype-highlight. */
export function CodeBlock({ children }: { children?: ReactNode }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const code = isValidElement<{ className?: string }>(children) ? children : null;
  const lang = /\blanguage-([\w+-]+)/.exec(code?.props.className ?? "")?.[1] ?? "text";

  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 1600);
    return () => clearTimeout(t);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(textOf(children).replace(/\n$/, ""));
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-spidey-border bg-spidey-code">
      <div className="flex items-center justify-between border-b border-spidey-border px-3 py-1">
        <span className="font-mono text-[11px] text-spidey-muted">{lang}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 font-mono text-[11px] text-spidey-muted transition-colors duration-150 hover:text-spidey-text"
          aria-label={state === "copied" ? "Copied" : "Copy code"}
        >
          {state === "copied" ? (
            <Check className="size-3.5 text-spidey-green" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          <span aria-hidden="true">
            {state === "copied" ? "Copied" : state === "failed" ? "Failed" : "Copy"}
          </span>
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[12.5px] leading-relaxed">{children}</pre>
    </div>
  );
}
