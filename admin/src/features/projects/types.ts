import type { ProjectCategory, RepoVisibility } from "@portfolio/shared";
import type { MediaItem } from "@/features/media/types";

export interface Project extends Record<string, unknown> {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  summary: string;
  description: string;
  highlights: string[];
  role: string | null;
  category: ProjectCategory;
  techStack: string[];
  repoUrl: string | null;
  repoVisibility: RepoVisibility;
  demoUrl: string | null;
  coverMediaId: number | null;
  cover: MediaItem | null;
  featured: boolean;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
  published: boolean;
  updatedAt: string;
}
