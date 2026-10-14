import { z } from "zod";
import { CONTACT_SERVICES } from "../enums.js";

export const contactMessageInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.email().trim().max(254),
  subject: z.string().trim().min(3).max(120),
  service: z.enum(CONTACT_SERVICES),
  message: z.string().trim().min(10).max(2000),
  // Honeypot: humans never see it. Non-empty → the API fakes success and drops the message.
  website: z.string().max(500).optional(),
});

export type ContactMessageInput = z.infer<typeof contactMessageInputSchema>;
