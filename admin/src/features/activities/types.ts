import type { MediaItem } from "@/features/media/types";

export interface Activity extends Record<string, unknown> {
  id: number;
  title: string;
  organization: string | null;
  location: string | null;
  role: string | null;
  description: string | null;
  periodLabel: string | null;
  date: string | null;
  images: MediaItem[];
  sortOrder: number;
  published: boolean;
  updatedAt: string;
}
