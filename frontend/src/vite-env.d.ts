/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME: string;
  readonly VITE_SITE_URL: string;
  /** portfolio-bot base URL; empty → no chat widget. */
  readonly VITE_ASSISTANT_URL?: string;
  /** Cloudflare Turnstile site key (public); empty → no challenge. */
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
