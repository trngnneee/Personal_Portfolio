import { Markdown } from "@portfolio/markdown";
import { memo } from "react";
import { CodeBlock } from "./CodeBlock";
import { SpideyIcon } from "./SpideyIcon";
import type { SpideyMessage } from "./useSpidey";

export function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1 py-2" role="status">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="spidey-dot size-1.5 rounded-full bg-spidey-green"
          style={{ animationDelay: `${delay}ms` }}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">Spidey is typing</span>
    </span>
  );
}

/**
 * Markdown is sanitised by the shared renderer (rehype-sanitize) and the bot already strips images,
 * HTML and off-allowlist links; images are additionally never rendered here.
 */
const AssistantMarkdown = memo(function AssistantMarkdown({ text }: { text: string }) {
  return (
    <Markdown className="spidey-md" components={{ img: () => null, pre: CodeBlock }}>
      {text}
    </Markdown>
  );
});

export function ChatMessage({ message }: { message: SpideyMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end pl-10">
        <p className="max-w-full rounded-2xl rounded-br-md border border-spidey-cyan/20 bg-spidey-raised px-3.5 py-2 text-sm break-words whitespace-pre-wrap text-spidey-text">
          <span className="sr-only">You: </span>
          {message.text}
        </p>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <span
        className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-spidey-green/25 bg-spidey-green/5 text-spidey-green"
        aria-hidden="true"
      >
        <SpideyIcon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="sr-only">Spidey: </span>
        {message.text ? <AssistantMarkdown text={message.text} /> : <TypingIndicator />}
      </div>
    </div>
  );
}
