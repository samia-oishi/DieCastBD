import { Suspense } from "react";
import { Outlet, useLocation } from "react-router";

import { AnnouncementBar } from "@/components/shared/AnnouncementBar";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

// Big footer (SHOP+HELP columns, newsletter, ghost watermark) on the routes
// with the most real estate to fill; slim single-row footer everywhere else,
// matching every *.dc.html reference exactly (AI_INSTRUCTIONS Phase 2).
const BIG_FOOTER_PREFIXES = [ROUTES.HOME, ROUTES.SHOP, "/products/"];
// PDP/Cart/Checkout get their own sticky bottom action bar in their own
// phase (6/7) and must not show the floating tab bar underneath/behind it.
const HIDE_BOTTOM_NAV_PREFIXES = [ROUTES.CART, ROUTES.CHECKOUT, "/products/"];

function matchesRoute(pathname, prefixes) {
  return prefixes.some((prefix) => (prefix === ROUTES.HOME ? pathname === ROUTES.HOME : pathname.startsWith(prefix)));
}

export function PublicLayout() {
  const { pathname } = useLocation();
  const footerVariant = matchesRoute(pathname, BIG_FOOTER_PREFIXES) ? "big" : "slim";
  const showBottomNav = !matchesRoute(pathname, HIDE_BOTTOM_NAV_PREFIXES);

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />
      <main className={cn("flex-1", showBottomNav && "pb-24 md:pb-0")}>
        <Suspense fallback={<FullPageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter variant={footerVariant} />
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}
