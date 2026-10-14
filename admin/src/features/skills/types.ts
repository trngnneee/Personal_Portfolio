import type { SkillCategory } from "@portfolio/shared";

export interface Skill extends Record<string, unknown> {
  id: number;
  name: string;
  category: SkillCategory;
  iconUrl: string | null;
  level: number | null;
  sortOrder: number;
  published: boolean;
  updatedAt: string;
}
