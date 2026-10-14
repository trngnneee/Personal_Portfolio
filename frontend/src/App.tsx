import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { ScrollToTop } from "@/lib/scroll";
import { AppRoutes } from "./router";

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* Honour prefers-reduced-motion for every motion component. */}
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <ScrollToTop />
            <AppRoutes />
          </BrowserRouter>
          <Toaster theme="dark" position="bottom-right" toastOptions={{ className: "font-mono" }} />
        </MotionConfig>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
