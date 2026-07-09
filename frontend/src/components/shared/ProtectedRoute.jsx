import { Navigate, Outlet, useLocation } from "react-router";
import { useCurrentUser } from "@/features/auth/api/useAuth";
import { ROUTES } from "@/constants/routes";
import { FullPageLoader } from "./FullPageLoader";

export function ProtectedRoute() {
  const location = useLocation();
  const { isLoading, isError } = useCurrentUser();

  if (isLoading) return <FullPageLoader />;

  if (isError) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${ROUTES.LOGIN}?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
