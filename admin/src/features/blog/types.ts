import type { BlogStatus } from "@portfolio/shared";
import type { MediaItem } from "@/features/media/types";

export interface BlogPost extends Record<string, unknown> {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverMediaId: number | null;
  cover: MediaItem | null;
  tags: string[];
  status: BlogStatus;
  publishedAt: string | null;
  readingMinutes: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}
