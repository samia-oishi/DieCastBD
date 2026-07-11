import { NavLink } from "react-router";
import { Home, LayoutGrid, Heart, ShoppingBag, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useCart } from "@/features/cart/api/useCart";

const TABS = [
  { to: ROUTES.HOME, label: "Home", icon: Home, end: true },
  { to: ROUTES.SHOP, label: "Shop", icon: LayoutGrid },
  { to: ROUTES.WISHLIST, label: "Saved", icon: Heart },
  { to: ROUTES.CART, label: "Cart", icon: ShoppingBag, cart: true },
  { to: ROUTES.ACCOUNT, label: "Account", icon: User },
];

/** Floating dark-glass bottom nav — mobile only (`md:hidden`). Hidden by
 * PublicLayout on routes with their own sticky action bars (cart/checkout/PDP). */
export function MobileBottomNav() {
  const { itemCount } = useCart();

  return (
    <nav
      data-testid="mobile-bottom-nav"
      aria-label="Primary"
      className="fixed inset-x-3 bottom-3 z-[60] flex h-[66px] items-center justify-around rounded-[22px] border border-white/16 bg-[rgba(13,15,7,0.92)] px-2 shadow-[0_10px_30px_rgba(16,18,8,0.45)] [backdrop-filter:blur(22px)_saturate(160%)] [-webkit-backdrop-filter:blur(22px)_saturate(160%)] md:hidden"
    >
      {TABS.map(({ to, label, icon: Icon, end, cart }) => (
        <NavLink
          key={label}
          to={to}
          end={end}
          className="relative flex min-w-11 flex-col items-center gap-[3px]"
        >
          {({ isActive }) => (
            <>
              <Icon
                size={20}
                strokeWidth={1.9}
                style={{ color: isActive ? "#C9E469" : "#B4B7A8" }}
              />
              {cart && itemCount > 0 && (
                <span className="absolute -right-1.5 -top-[5px] flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-[3px] text-[10px] font-extrabold text-ink">
                  {itemCount}
                </span>
              )}
              <span
                className={cn("text-[10px]", isActive ? "font-extrabold" : "font-semibold")}
                style={{ color: isActive ? "#C9E469" : "#B4B7A8" }}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
