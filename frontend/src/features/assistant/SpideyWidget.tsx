import { lazy, Suspense, useEffect, useId, useRef, useState } from "react";
import { assistantConfig } from "./config";
import { SpideyLauncher } from "./SpideyLauncher";
import { useSpidey } from "./useSpidey";

// Markdown renderer, Turnstile & the panel UI load on first open; the page only pays for the launcher.
const SpideyPanelHost = lazy(() =>
  import("./SpideyPanel").then((m) => ({ default: m.SpideyPanelHost })),
);

/** App-level Spidey. Renders nothing unless the build has VITE_ASSISTANT_URL. */
export function SpideyWidget() {
  const { url, turnstileSiteKey, enabled } = assistantConfig();
  return enabled ? <Widget baseUrl={url} turnstileSiteKey={turnstileSiteKey} /> : null;
}

function Widget({ baseUrl, turnstileSiteKey }: { baseUrl: string; turnstileSiteKey: string }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false); // panel chunk requested once, then kept mounted
  const spidey = useSpidey(baseUrl);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const panelId = useId();

  // Return focus to the launcher after closing (it is hidden on mobile while open, so wait a tick).
  useEffect(() => {
    if (wasOpen.current && !open) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const toggle = () => {
    if (!open && spidey.availability !== "available") void spidey.check();
    setLoaded(true);
    setOpen(!open);
  };

  return (
    <>
      <SpideyLauncher
        ref={launcherRef}
        open={open}
        availability={spidey.availability}
        panelId={panelId}
        onToggle={toggle}
      />
      {loaded && (
        <Suspense fallback={null}>
          <SpideyPanelHost
            open={open}
            id={panelId}
            spidey={spidey}
            turnstileSiteKey={turnstileSiteKey}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
