import { lazy } from "react";
import { createBrowserRouter } from "react-router";

import { PublicLayout } from "./layouts/PublicLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { NotFoundPage } from "@/components/shared/NotFoundPage";
import { UnauthorizedPage } from "@/components/shared/UnauthorizedPage";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { RequireRole } from "@/components/shared/RequireRole";
import { ROLES } from "@/constants/routes";

// Every page is code-split so a storefront visitor never downloads the admin
// dashboard (or vice versa). The layout shell + route guards stay eager since
// they're on the critical path for the first paint. React.lazy needs a default
// export; our pages are named, so this helper maps the named export across.
// The import() paths stay string literals so Rollup can still statically split them.
const page = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));

const HomePage = page(() => import("@/features/home/HomePage"), "HomePage");
const ShopPage = page(() => import("@/features/products/ShopPage"), "ShopPage");
const ProductDetailPage = page(() => import("@/features/products/ProductDetailPage"), "ProductDetailPage");
const WishlistPage = page(() => import("@/features/wishlist/WishlistPage"), "WishlistPage");
const CartPage = page(() => import("@/features/cart/CartPage"), "CartPage");
const CheckoutPage = page(() => import("@/features/checkout/CheckoutPage"), "CheckoutPage");
const OrdersPage = page(() => import("@/features/orders/OrdersPage"), "OrdersPage");
const OrderDetailPage = page(() => import("@/features/orders/OrderDetailPage"), "OrderDetailPage");
const OrderConfirmationPage = page(
  () => import("@/features/orders/OrderConfirmationPage"),
  "OrderConfirmationPage"
);
const LoginPage = page(() => import("@/features/auth/LoginPage"), "LoginPage");
const RegisterPage = page(() => import("@/features/auth/RegisterPage"), "RegisterPage");
const ForgotPasswordPage = page(() => import("@/features/auth/ForgotPasswordPage"), "ForgotPasswordPage");
const AccountPage = page(() => import("@/features/account/AccountPage"), "AccountPage");
const AboutPage = page(() => import("@/features/about-contact/AboutPage"), "AboutPage");
const ContactPage = page(() => import("@/features/about-contact/ContactPage"), "ContactPage");
const FaqPage = page(() => import("@/features/about-contact/FaqPage"), "FaqPage");
const PageView = page(() => import("@/features/pages/PageView"), "PageView");

const DashboardPage = page(() => import("@/features/admin/dashboard/DashboardPage"), "DashboardPage");
const ProductsPage = page(() => import("@/features/admin/products/ProductsPage"), "ProductsPage");
const ProductFormPage = page(() => import("@/features/admin/products/ProductFormPage"), "ProductFormPage");
const BrandsPage = page(() => import("@/features/admin/brands/BrandsPage"), "BrandsPage");
const CategoriesPage = page(() => import("@/features/admin/categories/CategoriesPage"), "CategoriesPage");
const AdminOrdersPage = page(() => import("@/features/admin/orders/OrdersPage"), "OrdersPage");
const AdminOrderDetailPage = page(() => import("@/features/admin/orders/OrderDetailPage"), "OrderDetailPage");
const CustomersPage = page(() => import("@/features/admin/customers/CustomersPage"), "CustomersPage");
const CustomerDetailPage = page(() => import("@/features/admin/customers/CustomerDetailPage"), "CustomerDetailPage");
const CouponsPage = page(() => import("@/features/admin/coupons/CouponsPage"), "CouponsPage");
const InventoryPage = page(() => import("@/features/admin/inventory/InventoryPage"), "InventoryPage");
const SettingsPage = page(() => import("@/features/admin/settings/SettingsPage"), "SettingsPage");
const ReportsPage = page(() => import("@/features/admin/reports/ReportsPage"), "ReportsPage");
const AdminNewsletterPage = page(() => import("@/features/admin/newsletter/NewsletterPage"), "NewsletterPage");
const AdminPagesPage = page(() => import("@/features/admin/pages/PagesPage"), "PagesPage");
const AdminPageFormPage = page(() => import("@/features/admin/pages/PageFormPage"), "PageFormPage");

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/shop", element: <ShopPage /> },
      { path: "/products/:slug", element: <ProductDetailPage /> },
      { path: "/cart", element: <CartPage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "/faq", element: <FaqPage /> },
      { path: "/terms-conditions", element: <PageView slug="terms-conditions" /> },
      { path: "/privacy-policy", element: <PageView slug="privacy-policy" /> },
      { path: "/refund-policy", element: <PageView slug="refund-policy" /> },
      { path: "/shipping-policy", element: <PageView slug="shipping-policy" /> },
      // Public: checkout and its confirmation must serve guests (System 1),
      // so they moved out of ProtectedRoute. CheckoutPage itself branches on
      // useCurrentUser() to show the saved-address book vs. a guest address
      // form; OrderConfirmationPage renders straight from router state and
      // never needs a session at all.
      { path: "/checkout", element: <CheckoutPage /> },
      { path: "/order-confirmation", element: <OrderConfirmationPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/account", element: <AccountPage /> },
          { path: "/wishlist", element: <WishlistPage /> },
          { path: "/orders", element: <OrdersPage /> },
          { path: "/orders/:orderNumber", element: <OrderDetailPage /> },
        ],
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
          { path: "orders", element: <AdminOrdersPage /> },
          { path: "orders/:id", element: <AdminOrderDetailPage /> },
          { path: "customers", element: <CustomersPage /> },
          { path: "customers/:id", element: <CustomerDetailPage /> },
          { path: "coupons", element: <CouponsPage /> },
          { path: "inventory", element: <InventoryPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "reports", element: <ReportsPage /> },
          { path: "newsletter", element: <AdminNewsletterPage /> },
          { path: "pages", element: <AdminPagesPage /> },
          { path: "pages/new", element: <AdminPageFormPage /> },
          { path: "pages/:id", element: <AdminPageFormPage /> },
        ],
      },
    ],
  },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "*", element: <NotFoundPage /> },
]);
