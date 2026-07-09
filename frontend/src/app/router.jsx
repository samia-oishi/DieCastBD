import { createBrowserRouter } from "react-router";

import { PublicLayout } from "./layouts/PublicLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { HomePage } from "@/features/home/HomePage";
import { DashboardPage } from "@/features/admin/dashboard/DashboardPage";
import { NotFoundPage } from "@/components/shared/NotFoundPage";
import { UnauthorizedPage } from "@/components/shared/UnauthorizedPage";

// Auth pages, protected-route/role guards, and the rest of the public routes
// (shop, PDP, cart, checkout...) are wired in as each phase builds them.
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [{ path: "/", element: <HomePage /> }],
  },
  {
    element: <AuthLayout />,
    children: [],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [{ index: true, element: <DashboardPage /> }],
  },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "*", element: <NotFoundPage /> },
]);
