import type { PublicMedia } from "@portfolio/shared";
import type { MediaRow } from "../media/service.js";

// Public DTOs: explicit allowlists, never raw rows.

export function publicMedia(m: MediaRow | undefined | null): PublicMedia | null {
  if (!m) return null;
  return { url: m.url, alt: m.alt, width: m.width, height: m.height, format: m.format };
}

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
