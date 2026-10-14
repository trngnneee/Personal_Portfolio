import { useToast } from "@astryxdesign/core/Toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { onUnauthorized, readToken, writeToken } from "@/lib/api";
import { login, logout, useMe } from "./api";

interface AuthContextValue {
  isAuthenticated: boolean;
  email: string | null;
  lastLoginAt: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Drop the local session without calling the API (after logout-all / password change). */
  endSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => readToken() !== null);
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  const me = useMe(isAuthenticated);

  const endSession = useCallback(() => {
    writeToken(null);
    setIsAuthenticated(false);
    qc.clear();
  }, [qc]);

  // Any 401 from the API: drop the session; ProtectedRoute then redirects to /login.
  useEffect(
    () =>
      onUnauthorized(() => {
        if (!isAuthenticated) return;
        endSession();
        toast({ body: t("auth.sessionExpired"), type: "error", uniqueID: "session-expired" });
      }),
    [isAuthenticated, endSession, toast, t],
  );

  // Proactively expire when the JWT's exp passes while the tab is open.
  useEffect(() => {
    const token = readToken();
    if (!isAuthenticated || !token) return;
    const ms = Date.parse(token.expiresAt) - Date.now();
    const timer = setTimeout(
      () => {
        endSession();
        toast({ body: t("auth.sessionExpired"), type: "error", uniqueID: "session-expired" });
      },
      Math.max(0, Math.min(ms, 2 ** 31 - 1)),
    );
    return () => clearTimeout(timer);
  }, [isAuthenticated, endSession, toast, t]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      email: me.data?.email ?? null,
      lastLoginAt: me.data?.lastLoginAt ?? null,
      async signIn(email, password) {
        writeToken(await login({ email, password }));
        setIsAuthenticated(true);
      },
      async signOut() {
        await logout();
        endSession();
      },
      endSession,
    }),
    [isAuthenticated, me.data, endSession],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
