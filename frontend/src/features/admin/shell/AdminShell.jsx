import { Suspense, useState } from "react";
import { NavLink, Outlet, Link, useLocation, matchPath } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { useCurrentUser } from "@/features/auth/api/useAuth";
import { ADMIN_NAV } from "./adminNav";

const FROST =
  "bg-[rgba(250,250,247,0.75)] [backdrop-filter:blur(24px)_saturate(180%)] [-webkit-backdrop-filter:blur(24px)_saturate(180%)]";

function initials(name, email) {
  const src = (name || email || "DB").trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "D") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "B")).toUpperCase();
}

function Logo() {
  return (
    <span className="font-display text-[18px] font-extrabold tracking-[-0.01em] text-ink">
      DiecastBD<span className="text-brand">.</span>
    </span>
  );
}

function AdminPill() {
  return (
    <span className="rounded-full border border-brand-soft-border bg-brand-tint px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.08em] text-brand-deep">
      Admin
    </span>
  );
}

/** One nav item. Icon color tracks active state (olive when active, faint idle). */
function NavItem({ to, label, icon: Icon, end, onNavigate, size = "md" }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-[10px] font-semibold transition-colors duration-150",
          size === "md" ? "px-3 py-[9px] text-[13.5px]" : "px-3 py-[11px] text-[14px]",
          isActive ? "bg-brand-tint text-ink" : "text-ink-soft hover:bg-tile"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={17} strokeWidth={2} className={isActive ? "text-brand-deep" : "text-faint"} />
          {label}
        </>
      )}
    </NavLink>
  );
}

function SidebarFooter({ user, onNavigate }) {
  return (
    <div className="border-t border-line px-3 py-3">
      <Link
        to={ROUTES.HOME}
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-[10px] px-3 py-[9px] text-[13.5px] font-semibold text-ink-soft transition-colors duration-150 hover:bg-tile"
      >
        <ExternalLink size={17} strokeWidth={2} className="text-faint" />
        Back to store
      </Link>
      <div className="mt-1 flex items-center gap-2.5 px-3 py-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-ink">
          {initials(user?.name, user?.email)}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-semibold text-ink">{user?.name || "Admin"}</div>
          {user?.email && <div className="truncate text-[11px] text-faint">{user.email}</div>}
        </div>
      </div>
    </div>
  );
}

/** The shared admin shell: fixed light sidebar (≥md), frosted mobile top bar +
 * slide-in drawer (<md), and the routed content area. Replaces the old dark
 * AdminLayout body. RequireRole + the lazy route boundary stay in the router. */
export function AdminShell() {
  const { data: user } = useCurrentUser();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Current page title for the mobile bar — longest matching nav path wins so
  // "/admin/orders/:id" still resolves to "Orders".
  const current =
    [...ADMIN_NAV]
      .filter((n) => n.to)
      .sort((a, b) => b.to.length - a.to.length)
      .find((n) => matchPath({ path: `/admin/${n.to}`, end: false }, pathname)) ??
    ADMIN_NAV[0];

  return (
    <div className="min-h-svh bg-paper text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col border-r border-line bg-white md:flex">
        <div className="flex items-center gap-2 px-5 pb-4 pt-[22px]">
          <Logo />
          <AdminPill />
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-1.5">
          {ADMIN_NAV.map((item) => (
            <NavItem key={item.label} {...item} />
          ))}
        </nav>
        <SidebarFooter user={user} />
      </aside>

      {/* Mobile top bar */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-line px-3 md:hidden",
          FROST
        )}
      >
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setDrawerOpen(true)}
          className="flex size-11 items-center justify-center rounded-[10px] text-ink hover:bg-tile"
        >
          <Menu size={22} strokeWidth={2} />
        </button>
        <span className="font-display text-[17px] font-extrabold text-ink">{current.label}</span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-ink">
          {initials(user?.name, user?.email)}
        </span>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[80] bg-[rgba(16,18,8,0.5)] [backdrop-filter:blur(4px)] md:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-[81] flex w-[280px] flex-col rounded-r-[24px] bg-white shadow-[0_12px_40px_rgba(16,18,8,0.25)] md:hidden"
            >
              <div className="flex items-center justify-between px-5 pb-4 pt-[18px]">
                <div className="flex items-center gap-2">
                  <Logo />
                  <AdminPill />
                </div>
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setDrawerOpen(false)}
                  className="flex size-9 items-center justify-center rounded-[10px] text-ink-soft hover:bg-tile"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-1.5">
                {ADMIN_NAV.map((item) => (
                  <NavItem key={item.label} {...item} size="lg" onNavigate={() => setDrawerOpen(false)} />
                ))}
              </nav>
              <SidebarFooter user={user} onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="px-4 pb-24 pt-[70px] md:pb-[60px] md:pl-[272px] md:pr-10 md:pt-[34px]">
        <div className="mx-auto max-w-[1180px]">
          <Suspense fallback={<FullPageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
