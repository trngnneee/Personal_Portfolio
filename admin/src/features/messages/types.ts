import type { ContactService, MessageStatus } from "@portfolio/shared";

export interface Message extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
  subject: string;
  service: ContactService;
  message: string;
  status: MessageStatus;
  userAgent: string | null;
  createdAt: string;
}
