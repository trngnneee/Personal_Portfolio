import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { ROUTE_SECTIONS } from "@/config/routes";
import { useEnabledSections } from "@/lib/queries";
import { NotFound } from "@/pages/NotFound";

/** Renders the page only if one of its sections is enabled; otherwise a 404. */
export function RouteGate({ route, children }: { route: string; children: ReactNode }) {
  const enabled = useEnabledSections();
  const { pathname } = useLocation();
  const keys = ROUTE_SECTIONS[route] ?? [];
  if (!keys.some((k) => enabled.has(k))) return <NotFound path={pathname} />;
  return children;
}
