import { useState } from "react";
import { Link, NavLink } from "react-router";
import toast from "react-hot-toast";
import { Heart, ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser, useLogoutMutation } from "@/features/auth/api/useAuth";
import { useSettings } from "@/features/settings/api/useSettings";
import { useCart } from "@/features/cart/api/useCart";
import { CartDrawer } from "@/features/cart/components/CartDrawer";
import logo from "@/assets/logo/logo.jpg";

const NAV_LINK_CLASS = ({ isActive }) =>
  cn("text-[14.5px] font-medium transition-colors", isActive ? "text-foreground" : "text-ink-soft hover:text-brand-deep");

function HeaderNavLink({ label, url }) {
  if (/^https?:\/\//.test(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={NAV_LINK_CLASS({ isActive: false })}>
        {label}
      </a>
    );
  }
  return (
    <NavLink to={url} className={NAV_LINK_CLASS}>
      {label}
    </NavLink>
  );
}

function IconCircleLink({ to, "aria-label": ariaLabel, badge, children }) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className="relative flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-brand"
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-ink">
          {badge}
        </span>
      )}
    </Link>
  );
}

function DesktopAuthState() {
  const { data: user, isLoading } = useCurrentUser();
  const logoutMutation = useLogoutMutation();

  if (isLoading) return null;

  if (!user) {
    return (
      <Link
        to={ROUTES.LOGIN}
        className="ml-1.5 rounded-full bg-ink px-[22px] py-[11px] text-sm font-semibold text-white transition-colors hover:bg-[#2A2E1C]"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {(user.role === "admin" || user.role === "staff") && (
        <Link to={ROUTES.ADMIN} className="text-[14.5px] font-medium text-ink-soft hover:text-brand-deep">
          Admin
        </Link>
      )}
      <Link to={ROUTES.ACCOUNT} className="text-[14.5px] font-medium text-foreground hover:text-brand-deep">
        {user.name}
      </Link>
      <button
        type="button"
        disabled={logoutMutation.isPending}
        onClick={() => logoutMutation.mutate(undefined, { onError: () => toast.error("Could not sign out") })}
        className="rounded-full border border-border px-4 py-[9px] text-sm font-medium text-ink-soft transition-colors hover:border-foreground/40 disabled:opacity-50"
      >
        Sign out
      </button>
    </div>
  );
}

/** Sticky frosted-glass storefront header — one component, two responsive
 * layouts (desktop nav row ≥md, a bare logo+cart app bar <md; the mobile
 * bottom nav covers Shop/Saved/Account there instead). Never rendered on
 * /admin — AdminLayout has its own unrelated sidebar shell. */
export function SiteHeader() {
  const [cartOpen, setCartOpen] = useState(false);
  const { data: settings } = useSettings();
  const { itemCount } = useCart();
  // Falls back to the original hardcoded "Shop" link if the admin-managed list
  // is empty (e.g. a live document that predates this field) — the header nav
  // must never end up completely blank.
  const headerLinks = settings?.navigation?.headerLinks?.length
    ? settings.navigation.headerLinks
    : [{ label: "Shop", url: ROUTES.SHOP }];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/60 backdrop-blur-[24px] backdrop-saturate-[1.8]">
      {/* Desktop / tablet */}
      <Container className="hidden h-[74px] items-center justify-between gap-8 md:flex">
        <Link to={ROUTES.HOME} className="shrink-0">
          <img src={logo} alt="DiecastBD" className="h-6 w-auto" />
        </Link>
        <nav className="flex flex-1 items-center gap-[30px]">
          {headerLinks.map((link) => (
            <HeaderNavLink key={link.url} label={link.label} url={link.url} />
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <IconCircleLink to={ROUTES.WISHLIST} aria-label="Wishlist">
            <Heart className="size-[17px]" />
          </IconCircleLink>
          <button
            type="button"
            aria-label="Cart"
            onClick={() => setCartOpen(true)}
            className="relative flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-brand"
          >
            <ShoppingBag className="size-[17px]" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-ink">
                {itemCount}
              </span>
            )}
          </button>
          <DesktopAuthState />
        </div>
      </Container>

      {/* Mobile app bar */}
      <div className="flex items-center justify-between px-4.5 pt-3.5 pb-3 md:hidden">
        <Link to={ROUTES.HOME}>
          <img src={logo} alt="DiecastBD" className="h-5 w-auto" />
        </Link>
        <button
          type="button"
          aria-label="Cart"
          onClick={() => setCartOpen(true)}
          className="relative flex size-[38px] items-center justify-center rounded-full border border-border bg-card text-foreground"
        >
          <ShoppingBag className="size-4" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-brand px-1 text-[10.5px] font-bold text-ink">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}
