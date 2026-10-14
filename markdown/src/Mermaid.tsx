import { useEffect, useId, useState } from "react";

interface MermaidProps {
  code: string;
  theme: "dark" | "default";
}

/** Renders a mermaid diagram; the library is only downloaded when a diagram is on the page. */
export function Mermaid({ code, theme }: MermaidProps) {
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("mermaid")
      .then(async ({ default: mermaid }) => {
        // "strict" sanitizes labels and disables click handlers / scripts.
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme });
        const result = await mermaid.render(id, code);
        if (!cancelled) setSvg(result.svg);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [code, id, theme]);

  if (failed || svg === null) {
    // Fallback (and pre-render state): the source itself.
    return (
      <pre className="md-mermaid-source" aria-busy={!failed && svg === null}>
        <code>{code}</code>
      </pre>
    );
  }
  return (
    <figure
      className="md-mermaid"
      role="img"
      aria-label="Diagram"
      // Output of mermaid in strict mode (DOMPurify-sanitized SVG).
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
