import type { SocialPlatform } from "@portfolio/shared";

// Astryx Table requires rows to extend Record<string, unknown>.
export interface SocialLink extends Record<string, unknown> {
  id: number;
  platform: SocialPlatform;
  label: string;
  url: string;
  sortOrder: number;
  visible: boolean;
  updatedAt: string;
}
