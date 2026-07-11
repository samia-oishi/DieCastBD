import { Link, useLocation, useNavigate, matchPath } from "react-router";
import { Heart, ShoppingBag, ArrowLeft, ChevronDown, User, Package, LayoutDashboard, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { ROUTES, ROLES } from "@/constants/routes";
import { useCurrentUser, useLogoutMutation } from "@/features/auth/api/useAuth";
import { useSettings } from "@/features/settings/api/useSettings";
import { useCart } from "@/features/cart/api/useCart";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo/logo.jpg";

const DEFAULT_HEADER_LINKS = [
  { label: "New arrivals", url: ROUTES.SHOP },
  { label: "Hot Wheels Premium", url: "/shop?brand=hot-wheels-premium" },
  { label: "MINI GT", url: "/shop?brand=mini-gt" },
  { label: "Accessories", url: "/shop?category=accessories" },
];

const FROST = "bg-[rgba(250,250,247,0.6)] [backdrop-filter:blur(24px)_saturate(180%)] [-webkit-backdrop-filter:blur(24px)_saturate(180%)]";

function CartButton({ count, onClick, className, iconSize = 17, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Cart${count ? `, ${count} items` : ""}`}
      className={cn(
        "relative flex items-center justify-center rounded-full border bg-white text-ink transition-colors hover:border-brand",
        active ? "border-brand" : "border-line",
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

/** Signed-in user's name as a dropdown → account, orders, wishlist, admin
 * dashboard (staff/admin only), and sign out. */
function UserMenu({ user }) {
  const navigate = useNavigate();
  const logout = useLogoutMutation();
  const isStaff = user.role === ROLES.ADMIN || user.role === ROLES.STAFF;
  const firstName = user.name?.split(" ")[0] || "Account";

  const onSignOut = () => logout.mutate(undefined, { onSuccess: () => navigate(ROUTES.HOME) });

  const item = "flex cursor-pointer items-center gap-2.5 text-[13.5px]";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="ml-1.5 flex items-center gap-1.5 rounded-full bg-ink py-[11px] pl-[22px] pr-4 text-sm font-semibold text-white transition-colors hover:bg-[#2A2E1C]"
        >
          {firstName}
          <ChevronDown size={15} strokeWidth={2} className="opacity-80" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-[16px] p-1.5">
        <DropdownMenuLabel className="px-2 pb-1 pt-1.5 font-normal">
          <div className="text-[13px] font-semibold text-ink">{user.name}</div>
          {user.email && <div className="truncate text-xs text-muted-foreground">{user.email}</div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={item} onClick={() => navigate(ROUTES.ACCOUNT)}>
          <User size={15} strokeWidth={1.9} /> My account
        </DropdownMenuItem>
        <DropdownMenuItem className={item} onClick={() => navigate(ROUTES.ORDERS)}>
          <Package size={15} strokeWidth={1.9} /> My orders
        </DropdownMenuItem>
        <DropdownMenuItem className={item} onClick={() => navigate(ROUTES.WISHLIST)}>
          <Heart size={15} strokeWidth={1.9} /> Wishlist
        </DropdownMenuItem>
        {isStaff && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className={item} onClick={() => navigate(ROUTES.ADMIN)}>
              <LayoutDashboard size={15} strokeWidth={1.9} /> Admin dashboard
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className={cn(item, "text-[#B3261E] focus:text-[#B3261E]")} onClick={onSignOut}>
          <LogOut size={15} strokeWidth={1.9} /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DesktopHeader({ links, cartCount, onCartClick, user, cartActive }) {
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
          <CartButton count={cartCount} onClick={onCartClick} className="size-10" active={cartActive} />
          {user ? (
            <UserMenu user={user} />
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

const APPBAR_CIRCLE = "flex size-[38px] items-center justify-center rounded-full border border-line bg-white text-ink";

function MobileAppBar({ cartCount, onCartClick }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // Product-detail routes get a back-button app bar (back · logo · wishlist · cart)
  // per the design; the cart gets a titled back bar; every other route gets the
  // plain logo · cart bar.
  const isDetail = !!matchPath({ path: ROUTES.PRODUCT, end: true }, pathname);
  const isCart = !!matchPath({ path: ROUTES.CART, end: true }, pathname);

  if (isCart) {
    return (
      <header className={cn("sticky top-0 z-50 flex items-center justify-between border-b border-[rgba(231,232,224,0.6)] px-4 py-3 md:hidden", FROST)}>
        <button type="button" onClick={() => navigate(-1)} aria-label="Back" className={APPBAR_CIRCLE}>
          <ArrowLeft size={16} strokeWidth={2} />
        </button>
        <span className="font-display text-[17px] font-bold text-ink">Your cart{cartCount ? ` (${cartCount})` : ""}</span>
        <div className="w-[38px]" />
      </header>
    );
  }

  return (
    <header className={cn("sticky top-0 z-50 flex items-center justify-between border-b border-[rgba(231,232,224,0.6)] px-4 pb-3 pt-3 md:hidden", FROST)}>
      {isDetail ? (
        <>
          <button type="button" onClick={() => navigate(-1)} aria-label="Back" className={APPBAR_CIRCLE}>
            <ArrowLeft size={16} strokeWidth={2} />
          </button>
          <Link to={ROUTES.HOME}>
            <img src={logo} alt="DiecastBD" className="block h-[18px] w-auto" />
          </Link>
          <div className="flex gap-2">
            <Link to={ROUTES.WISHLIST} aria-label="Wishlist" className={APPBAR_CIRCLE}>
              <Heart size={15} strokeWidth={1.8} />
            </Link>
            <CartButton count={cartCount} onClick={onCartClick} className="size-[38px]" iconSize={15} />
          </div>
        </>
      ) : (
        <>
          <Link to={ROUTES.HOME}>
            <img src={logo} alt="DiecastBD" className="block h-5 w-auto" />
          </Link>
          <CartButton count={cartCount} onClick={onCartClick} className="size-[38px]" iconSize={16} />
        </>
      )}
    </header>
  );
}

export function SiteHeader({ onCartClick }) {
  const { data: settings } = useSettings();
  const { data: user } = useCurrentUser();
  const { itemCount } = useCart();
  const { pathname } = useLocation();

  const links = settings?.navigation?.headerLinks?.length
    ? settings.navigation.headerLinks
    : DEFAULT_HEADER_LINKS;

  return (
    <>
      <DesktopHeader links={links} cartCount={itemCount} onCartClick={onCartClick} user={user} cartActive={pathname === ROUTES.CART} />
      <MobileAppBar cartCount={itemCount} onCartClick={onCartClick} />
    </>
  );
}
