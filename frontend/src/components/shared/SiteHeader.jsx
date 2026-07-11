import { Link } from "react-router";
import { Heart, ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser } from "@/features/auth/api/useAuth";
import { useSettings } from "@/features/settings/api/useSettings";
import { useCart } from "@/features/cart/api/useCart";
import logo from "@/assets/logo/logo.jpg";

const DEFAULT_HEADER_LINKS = [
  { label: "New arrivals", url: ROUTES.SHOP },
  { label: "Hot Wheels Premium", url: "/shop?brand=hot-wheels-premium" },
  { label: "MINI GT", url: "/shop?brand=mini-gt" },
  { label: "Accessories", url: "/shop?category=accessories" },
];

const FROST = "bg-[rgba(250,250,247,0.6)] [backdrop-filter:blur(24px)_saturate(180%)] [-webkit-backdrop-filter:blur(24px)_saturate(180%)]";

function CartButton({ count, onClick, className, iconSize = 17 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Cart${count ? `, ${count} items` : ""}`}
      className={cn(
        "relative flex items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-brand",
        className
      )}
    >
      <ShoppingBag size={iconSize} strokeWidth={1.8} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-ink">
          {count}
        </span>
      )}
    </button>
  );
}

function DesktopHeader({ links, cartCount, onCartClick, user }) {
  return (
    <header className={cn("sticky top-0 z-50 hidden border-b border-line md:block", FROST)}>
      <div className="mx-auto flex h-[74px] max-w-[1360px] items-center justify-between gap-8 px-10">
        <Link to={ROUTES.HOME} className="shrink-0">
          <img src={logo} alt="DiecastBD" className="block h-6 w-auto" />
        </Link>
        <nav className="flex items-center gap-[30px] text-[14.5px] font-medium text-ink-soft">
          {links.map((link) => (
            <NavItem key={link.label} label={link.label} url={link.url} />
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.WISHLIST}
            aria-label="Wishlist"
            className="flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-brand"
          >
            <Heart size={17} strokeWidth={1.8} />
          </Link>
          <CartButton count={cartCount} onClick={onCartClick} className="size-10" />
          {user ? (
            <Link
              to={ROUTES.ACCOUNT}
              className="ml-1.5 rounded-full bg-ink px-[22px] py-[11px] text-sm font-semibold text-white transition-colors hover:bg-[#2A2E1C]"
            >
              {user.name?.split(" ")[0] || "Account"}
            </Link>
          ) : (
            <Link
              to={ROUTES.LOGIN}
              className="ml-1.5 rounded-full bg-ink px-[22px] py-[11px] text-sm font-semibold text-white transition-colors hover:bg-[#2A2E1C]"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function NavItem({ label, url }) {
  if (/^https?:\/\//.test(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#5F7A10]">
        {label}
      </a>
    );
  }
  return (
    <Link to={url} className="transition-colors hover:text-[#5F7A10]">
      {label}
    </Link>
  );
}

function MobileAppBar({ cartCount, onCartClick }) {
  return (
    <header className={cn("sticky top-0 z-50 flex items-center justify-between border-b border-[rgba(231,232,224,0.6)] px-[18px] pb-3 pt-3.5 md:hidden", FROST)}>
      <Link to={ROUTES.HOME}>
        <img src={logo} alt="DiecastBD" className="block h-5 w-auto" />
      </Link>
      <CartButton count={cartCount} onClick={onCartClick} className="size-[38px]" iconSize={16} />
    </header>
  );
}

export function SiteHeader({ onCartClick }) {
  const { data: settings } = useSettings();
  const { data: user } = useCurrentUser();
  const { itemCount } = useCart();

  const links = settings?.navigation?.headerLinks?.length
    ? settings.navigation.headerLinks
    : DEFAULT_HEADER_LINKS;

  return (
    <>
      <DesktopHeader links={links} cartCount={itemCount} onCartClick={onCartClick} user={user} />
      <MobileAppBar cartCount={itemCount} onCartClick={onCartClick} />
    </>
  );
}
