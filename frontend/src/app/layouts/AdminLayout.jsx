import { NavLink, Outlet, Link } from "react-router";
import { LayoutDashboard, Package, Tags, Boxes, ClipboardList, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

const NAV_ITEMS = [
  { to: "", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "orders", label: "Orders", icon: ClipboardList },
  { to: "products", label: "Products", icon: Package },
  { to: "brands", label: "Brands", icon: Boxes },
  { to: "categories", label: "Categories", icon: Tags },
];

export function AdminLayout() {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar px-4 py-6 text-sidebar-foreground">
        <div>
          <span className="font-heading text-lg tracking-wide">DiecastBD Admin</span>
          <nav className="mt-8 flex flex-col gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={label}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <Link
          to={ROUTES.HOME}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ExternalLink className="size-4" />
          Back to store
        </Link>
      </aside>
      <main className="flex-1 overflow-x-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
