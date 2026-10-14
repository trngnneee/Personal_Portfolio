import type { StatusVariant } from "@/components/common/StatusLabel";

/** Published / hidden, used by every content list. */
export const publishedVariant = (published: boolean): StatusVariant =>
  published ? "success" : "neutral";
