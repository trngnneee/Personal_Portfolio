import { Navigate, Outlet, useLocation } from "react-router";
import { ROUTES } from "@/config/app";
import { useAuth } from "./AuthContext";

/** The only route guard: unauthenticated users go to /login and come back afterwards. */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to={ROUTES.login} state={{ from: location }} replace />;
  return <Outlet />;
}
