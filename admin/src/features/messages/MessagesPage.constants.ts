import type { MessageStatus } from "@portfolio/shared";
import type { StatusVariant } from "@/components/common/StatusLabel";

export const STATUS_VARIANT: Record<MessageStatus, StatusVariant> = {
  new: "accent",
  read: "neutral",
  archived: "warning",
};
