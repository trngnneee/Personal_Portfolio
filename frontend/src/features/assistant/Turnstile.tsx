import { useEffect, useRef } from "react";
import { loadTurnstile } from "./turnstile-loader";

/**
 * Invisible unless Cloudflare needs an interaction. Reports a token (or null when expired/failed);
 * bumping `resetKey` asks for a fresh token.
 */
export function Turnstile({
  siteKey,
  resetKey,
  onToken,
  onError,
}: {
  siteKey: string;
  resetKey: number;
  onToken: (token: string | null) => void;
  onError: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  // Latest callbacks without re-rendering the widget.
  const cb = useRef({ onToken, onError });
  useEffect(() => {
    cb.current = { onToken, onError };
  });

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then((ts) => {
        if (cancelled || !box.current) return;
        widget.current = ts.render(box.current, {
          sitekey: siteKey,
          appearance: "interaction-only",
          theme: "dark",
          language: "vi",
          callback: (t) => cb.current.onToken(t),
          "expired-callback": () => cb.current.onToken(null),
          "error-callback": () => {
            cb.current.onToken(null);
            cb.current.onError();
            return true;
          },
        });
      })
      .catch(() => cb.current.onError());
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetKey > 0 && widget.current) {
      cb.current.onToken(null);
      window.turnstile?.reset(widget.current);
    }
  }, [resetKey]);

  return <div ref={box} className="flex justify-center empty:hidden" />;
}
