import { AdminShell } from "@/features/admin/shell/AdminShell";

// The admin dashboard shell (light design system). RequireRole guards this and
// every child page is lazy — see router.jsx. All shell UI lives in
// features/admin/shell/ so pages can reuse its pieces (header, toast, bars…).
export function AdminLayout() {
  return <AdminShell />;
}
