import { motion } from "motion/react";

interface TerminalHeaderProps {
  /** Shell command shown after the prompt, e.g. "ls ~/projects". */
  command: string;
  title: string;
  description?: string;
  /** Heading level; pages use h1, page sub-sections use h2. */
  as?: "h1" | "h2";
}

export function TerminalHeader({
  command,
  title,
  description,
  as: Heading = "h1",
}: TerminalHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-10"
    >
      {command && (
        <p className="font-mono text-sm text-primary-500">
          <span className="text-neutral-400" aria-hidden="true">
            trngnneee@portfolio:~${" "}
          </span>
          {command}
        </p>
      )}
      <Heading className="mt-2 font-mono text-3xl font-bold text-neutral-50 sm:text-4xl">
        {title}
      </Heading>
      {description && <p className="mt-3 max-w-2xl text-neutral-300">{description}</p>}
    </motion.header>
  );
}
