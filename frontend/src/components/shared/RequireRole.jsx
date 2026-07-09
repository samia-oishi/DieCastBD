import { Navigate, Outlet } from "react-router";
import { useCurrentUser } from "@/features/auth/api/useAuth";
import { ROUTES } from "@/constants/routes";
import { FullPageLoader } from "./FullPageLoader";

export function RequireRole({ roles }) {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) return <FullPageLoader />;
  if (isError || !user) return <Navigate to={ROUTES.LOGIN} replace />;
  if (!roles.includes(user.role)) return <Navigate to={ROUTES.UNAUTHORIZED} replace />;

  return <Outlet />;
}
