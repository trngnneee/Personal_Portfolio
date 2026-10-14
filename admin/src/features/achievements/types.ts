import type { AchievementType } from "@portfolio/shared";
import type { MediaItem } from "@/features/media/types";

export interface Achievement extends Record<string, unknown> {
  id: number;
  type: AchievementType;
  title: string;
  issuer: string | null;
  periodLabel: string | null;
  date: string | null;
  description: string | null;
  accentColor: string | null;
  credentialUrl: string | null;
  mediaId: number | null;
  media: MediaItem | null;
  sortOrder: number;
  published: boolean;
  updatedAt: string;
}
