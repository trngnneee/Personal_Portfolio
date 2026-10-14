import { isValidElement, type ReactElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { Mermaid } from "./Mermaid";

export interface MarkdownProps {
  children: string;
  className?: string;
  /** Per-element overrides (e.g. responsive images, router links). */
  components?: Components;
  mermaidTheme?: "dark" | "default";
}

// Order matters: sanitize the author's HTML first, then add trusted ids and highlight classes.
const rehypePlugins = [
  rehypeSanitize,
  rehypeSlug,
  [rehypeHighlight, { plainText: ["mermaid", "text", "txt"] }],
] as const;

type CodeElement = ReactElement<{ className?: string; children?: ReactNode }>;

const isMermaid = (node: ReactNode): node is CodeElement =>
  isValidElement<{ className?: string }>(node) &&
  /\blanguage-mermaid\b/.test(node.props.className ?? "");

const textOf = (node: ReactNode): string =>
  typeof node === "string"
    ? node
    : Array.isArray(node)
      ? node.map(textOf).join("")
      : isValidElement<{ children?: ReactNode }>(node)
        ? textOf(node.props.children)
        : "";

const SAFE_PROTOCOL = /^(https?:|mailto:|#|\/)/i;

export function Markdown({
  children,
  className,
  components,
  mermaidTheme = "dark",
}: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins as never}
        // Belt and braces on top of rehype-sanitize's protocol allowlist.
        urlTransform={(url) => (SAFE_PROTOCOL.test(url) ? url : "")}
        components={{
          pre: ({ children: child, node: _node, ...rest }) =>
            isMermaid(child) ? (
              <Mermaid code={textOf(child.props.children).trim()} theme={mermaidTheme} />
            ) : (
              <pre {...rest}>{child}</pre>
            ),
          a: ({ href, children: label, node: _node, ...rest }) => {
            const external = href ? /^https?:/i.test(href) : false;
            return (
              <a
                href={href}
                {...rest}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {label}
              </a>
            );
          },
          table: ({ node: _node, ...rest }) => (
            <div className="md-table-wrap">
              <table {...rest} />
            </div>
          ),
          ...components,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
