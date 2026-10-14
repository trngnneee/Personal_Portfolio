import type { EmploymentType } from "@portfolio/shared";
import type { MediaItem } from "@/features/media/types";

export interface Experience extends Record<string, unknown> {
  id: number;
  company: string;
  companyUrl: string | null;
  logoMediaId: number | null;
  logo: MediaItem | null;
  position: string;
  employmentType: EmploymentType;
  location: string | null;
  startDate: string;
  endDate: string | null;
  description: string;
  highlights: string[];
  techStack: string[];
  sortOrder: number;
  published: boolean;
  updatedAt: string;
}
