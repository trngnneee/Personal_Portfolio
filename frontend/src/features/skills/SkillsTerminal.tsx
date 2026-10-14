import type { PublicProfile, PublicSkill } from "@portfolio/shared";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { runCommand, type TerminalLine } from "./terminal";

const PROMPT = "trngnneee@skills:~$";

export function SkillsTerminal({
  skills,
  profile,
}: {
  skills: PublicSkill[];
  profile: PublicProfile | null;
}) {
  const inputId = useId();
  const nextId = useRef(1);
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 0, kind: "output", text: "Type 'help' to see available commands." },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const push = (kind: TerminalLine["kind"], text: string) => ({ id: nextId.current++, kind, text });

  const execute = () => {
    const command = input;
    setInput("");
    setCursor(-1);
    if (command.trim()) setHistory((h) => [command, ...h].slice(0, 50));
    const result = runCommand(command, skills, profile);
    if (result === "clear") {
      setLines([]);
      return;
    }
    const isError = result.some((l) => /not found|No such|missing operand/.test(l));
    setLines((prev) => [
      ...prev,
      push("input", command),
      ...result.map((text) => push(isError ? "error" : "output", text)),
    ]);
    requestAnimationFrame(() => {
      const el = outputRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      execute();
    } else if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      const next = Math.min(cursor + 1, history.length - 1);
      setCursor(next);
      setInput(history[next]!);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = cursor - 1;
      setCursor(next);
      setInput(next >= 0 ? history[next]! : "");
    }
  };

  return (
    <TerminalWindow title="skills-terminal" className="transition-colors focus-within:border-primary-700">
      {/* Clicking anywhere focuses the prompt, like a real terminal. */}
      <div className="p-4 font-mono text-sm" onClick={() => inputRef.current?.focus()}>
        <div
          ref={outputRef}
          className="max-h-80 overflow-y-auto"
          role="log"
          aria-live="polite"
          aria-label="Terminal output"
        >
          {lines.map((l) => (
            <p
              key={l.id}
              className={
                l.kind === "input"
                  ? "text-neutral-100"
                  : l.kind === "error"
                    ? "text-danger-300"
                    : "whitespace-pre-wrap text-neutral-300"
              }
            >
              {l.kind === "input" && <span className="text-primary-500">{PROMPT} </span>}
              {l.text}
            </p>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <label htmlFor={inputId} className="shrink-0 text-primary-500">
            {PROMPT}
            <span className="sr-only"> Enter a command</span>
          </label>
          <input
            id={inputId}
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-neutral-50 caret-primary-500 outline-none"
          />
        </div>
      </div>
    </TerminalWindow>
  );
}
