import type { ChangePasswordInput, LoginInput } from "@portfolio/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { request, type StoredToken } from "@/lib/api";

export interface Me {
  email: string;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
}

export const authKeys = { me: ["admin", "auth", "me"] as const };

export const login = (input: LoginInput) =>
  request<StoredToken>("/auth/login", { method: "POST", body: input, isAuthRequest: true });

export const logout = () =>
  request<void>("/auth/logout", { method: "POST" }).catch(() => undefined);

export const useMe = (enabled: boolean) =>
  useQuery({ queryKey: authKeys.me, queryFn: () => request<Me>("/auth/me"), enabled });

export const useChangePassword = () =>
  useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      request<void>("/auth/change-password", { method: "POST", body: input }),
  });

export const useLogoutAll = () =>
  useMutation({ mutationFn: () => request<void>("/auth/logout-all", { method: "POST" }) });
