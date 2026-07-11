import { NavLink } from "react-router";
import { House, LayoutGrid, Heart, ShoppingBag, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useCart } from "@/features/cart/api/useCart";

const TABS = [
  { to: ROUTES.HOME, label: "Home", icon: House, end: true },
  { to: ROUTES.SHOP, label: "Shop", icon: LayoutGrid },
  { to: ROUTES.WISHLIST, label: "Saved", icon: Heart },
  { to: ROUTES.CART, label: "Cart", icon: ShoppingBag },
  { to: ROUTES.ACCOUNT, label: "Account", icon: User },
];

const TAB_CLASS = ({ isActive }) =>
  cn("flex flex-col items-center gap-[3px]", isActive ? "text-brand-glow" : "text-[#B4B7A8]");

/** Fixed floating dark-glass tab bar — mobile only (<768px), replaced on
 * PDP/Cart/Checkout by those pages' own sticky action bars (see
 * PublicLayout's HIDDEN_BOTTOM_NAV_PREFIXES). Home/Shop/Saved/Account are
 * plain nav; Cart carries the live item-count badge from the shared cart
 * hook (guest Zustand cart or server cart, whichever is active). */
export function MobileBottomNav() {
  const { itemCount } = useCart();

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-[60] flex h-[66px] items-center justify-around rounded-[22px] border border-white/16 bg-[rgba(13,15,7,.92)] px-2 shadow-[0_10px_30px_rgba(16,18,8,.45)] backdrop-blur-[22px] backdrop-saturate-[1.6] md:hidden"
      aria-label="Primary"
    >
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={label} to={to} end={end} className={TAB_CLASS} aria-label={label}>
          {({ isActive }) => (
            <>
              <span className="relative">
                <Icon className="size-5" strokeWidth={1.9} />
                {label === "Cart" && itemCount > 0 && (
                  <span className="absolute -top-[5px] -right-[7px] flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-[3px] text-[10px] font-extrabold text-ink">
                    {itemCount}
                  </span>
                )}
              </span>
              <span className={cn("text-[10px]", isActive ? "font-extrabold" : "font-semibold")}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
