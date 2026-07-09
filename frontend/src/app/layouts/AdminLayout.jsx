import { Outlet } from "react-router";

export function AdminLayout() {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar px-4 py-6 text-sidebar-foreground">
        <span className="font-heading text-lg tracking-wide">DiecastBD Admin</span>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
