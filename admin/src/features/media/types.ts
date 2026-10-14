// Astryx Table requires rows to extend Record<string, unknown>.
export interface MediaItem extends Record<string, unknown> {
  id: number;
  url: string;
  publicId: string | null;
  resourceType: "image" | "raw";
  format: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  alt: string;
  folder: string;
  createdAt: string;
  usageCount?: number;
}

export const MEDIA_FOLDERS = [
  "library",
  "profile",
  "projects",
  "achievements",
  "activities",
  "blog",
  "experiences",
  "seed",
] as const;
