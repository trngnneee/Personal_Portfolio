// Read at call time (not module load) so tests can stub the env.
export function assistantConfig() {
  const url = (import.meta.env.VITE_ASSISTANT_URL ?? "").replace(/\/$/, "");
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";
  return { url, turnstileSiteKey, enabled: url !== "" };
}
