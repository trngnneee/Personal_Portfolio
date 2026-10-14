import { SUGGESTIONS } from "./suggestions";

/** Empty state: shown on first open and after a restart. */
export function SpideyWelcome({
  disabled,
  onPick,
}: {
  disabled: boolean;
  onPick: (prompt: string) => void;
}) {
  return (
    <div className="flex min-h-full flex-col justify-end gap-5">
      <div className="rounded-xl border border-spidey-border bg-spidey-surface p-4">
        <p className="font-mono text-xs text-spidey-green">
          <span className="text-spidey-muted" aria-hidden="true">
            ${" "}
          </span>
          whoami
        </p>
        <p className="mt-3 text-[15px] font-medium text-spidey-text">
          Hey, I&apos;m Spidey — Nguyen&apos;s AI assistant.
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-spidey-muted">
          Ask me about his engineering experience, DevOps projects, infrastructure, or homelab.
        </p>
      </div>
      <div>
        <h3 className="font-mono text-[11px] tracking-wider text-spidey-muted uppercase">
          What would you like to explore?
        </h3>
        <ul className="mt-2.5 grid grid-cols-2 gap-2">
          {SUGGESTIONS.map(({ title, description, prompt, icon: Icon }) => (
            <li key={title}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(prompt)}
                className="group/s flex h-full w-full flex-col items-start gap-2 rounded-xl border border-spidey-border bg-spidey-surface p-3 text-left transition-[border-color,background-color] duration-150 hover:border-spidey-cyan/40 hover:bg-spidey-raised disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon
                  className="size-4 text-spidey-cyan transition-colors duration-150 group-hover/s:text-spidey-green"
                  aria-hidden="true"
                />
                <span>
                  <span className="block font-mono text-[13px] font-medium text-spidey-text">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-spidey-muted">
                    {description}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
