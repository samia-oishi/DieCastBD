import { createBrowserRouter } from "react-router";

import { PublicLayout } from "./layouts/PublicLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { HomePage } from "@/features/home/HomePage";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { AccountPage } from "@/features/account/AccountPage";
import { DashboardPage } from "@/features/admin/dashboard/DashboardPage";
import { ProductsPage } from "@/features/admin/products/ProductsPage";
import { ProductFormPage } from "@/features/admin/products/ProductFormPage";
import { BrandsPage } from "@/features/admin/brands/BrandsPage";
import { CategoriesPage } from "@/features/admin/categories/CategoriesPage";
import { NotFoundPage } from "@/components/shared/NotFoundPage";
import { UnauthorizedPage } from "@/components/shared/UnauthorizedPage";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { RequireRole } from "@/components/shared/RequireRole";
import { ROLES } from "@/constants/routes";

// The rest of the public routes (shop, PDP, cart, checkout...) and protected
// customer routes (orders, wishlist...) wire in the same way as each phase builds them.
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      {
        element: <ProtectedRoute />,
        children: [{ path: "/account", element: <AccountPage /> }],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
    ],
  },
  {
    path: "/admin",
    element: <RequireRole roles={[ROLES.ADMIN, ROLES.STAFF]} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "products", element: <ProductsPage /> },
          { path: "products/new", element: <ProductFormPage /> },
          { path: "products/:id", element: <ProductFormPage /> },
          { path: "brands", element: <BrandsPage /> },
          { path: "categories", element: <CategoriesPage /> },
        ],
      },
    ],
  },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "*", element: <NotFoundPage /> },
]);
