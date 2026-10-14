import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 12;

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(256),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(256),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
