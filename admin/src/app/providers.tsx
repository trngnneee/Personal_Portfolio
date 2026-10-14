import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { LinkProvider } from "@astryxdesign/core/Link";
import viVN from "@astryxdesign/core/locales/vi-VN.generated.js";
import { ToastViewport } from "@astryxdesign/core/Toast";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "@/features/auth/AuthContext";
import { queryClient } from "@/lib/query-client";
import { RouterLink } from "@/lib/router-link";
import { AppThemeProvider } from "./theme";

/** Providers that don't depend on the router. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <AstryxI18n>{children}</AstryxI18n>
      </AppThemeProvider>
    </QueryClientProvider>
  );
}

/** Astryx's built-in strings (Required, Optional, pagination…) follow the app language. */
function AstryxI18n({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const locale = i18n.language === "vi" ? "vi-VN" : "en";
  return (
    <InternationalizationProvider locale={locale} messages={{ "vi-VN": viVN }}>
      {children}
    </InternationalizationProvider>
  );
}

/**
 * Providers that need router context (rendered by the root route).
 * ToastViewport wraps AuthProvider so auth can toast "session expired" (see DEVIATIONS.md).
 */
export function RouterProviders({ children }: { children: ReactNode }) {
  return (
    <LinkProvider component={RouterLink}>
      <ToastViewport position="bottomEnd" maxVisible={3}>
        <AuthProvider>{children}</AuthProvider>
      </ToastViewport>
    </LinkProvider>
  );
}
