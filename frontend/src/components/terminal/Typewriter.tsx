import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

interface TypewriterProps {
  lines: string[];
  /** ms per character while typing. */
  speed?: number;
  /** Pause on a finished line before deleting it. */
  pause?: number;
  loop?: boolean;
  className?: string;
}

/**
 * Types each line, deletes it, moves to the next. Screen readers get the full text once;
 * with prefers-reduced-motion the first line is shown statically.
 */
export function Typewriter({
  lines,
  speed = 60,
  pause = 1600,
  loop = true,
  className,
}: TypewriterProps) {
  const reduce = useReducedMotion();
  const [lineIndex, setLineIndex] = useState(0);
  const [length, setLength] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const line = lines[lineIndex] ?? "";
  const chars = Array.from(line); // keep emoji intact

  useEffect(() => {
    if (reduce || lines.length === 0) return;
    const isLast = lineIndex === lines.length - 1;
    if (!deleting && length < chars.length) {
      const t = setTimeout(() => setLength((n) => n + 1), speed);
      return () => clearTimeout(t);
    }
    if (!deleting) {
      if (isLast && !loop) return;
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (length > 0) {
      const t = setTimeout(() => setLength((n) => n - 1), speed / 2);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setDeleting(false);
      setLineIndex((i) => (i + 1) % lines.length);
    }, speed);
    return () => clearTimeout(t);
  }, [reduce, lines.length, lineIndex, length, deleting, chars.length, speed, pause, loop]);

  const visible = reduce ? line : chars.slice(0, length).join("");

  // The longest line is laid out invisibly in the same grid cell, so typing never
  // changes the element's size (no layout shift).
  const longest = lines.reduce((a, b) => (Array.from(b).length > Array.from(a).length ? b : a), "");

  return (
    <span className={className}>
      <span className="sr-only">{lines.join(" ")}</span>
      <span aria-hidden="true" className="inline-grid">
        <span className="invisible [grid-area:1/1]">{longest}▍</span>
        <span className="[grid-area:1/1]">
          {visible}
          <span className="cursor-blink text-primary-500">▍</span>
        </span>
      </span>
    </span>
  );
}
