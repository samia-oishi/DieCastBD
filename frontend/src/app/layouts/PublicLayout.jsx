import { Suspense, useState } from "react";
import { Outlet, useLocation, matchPath } from "react-router";

import { AnnouncementBar } from "@/components/shared/AnnouncementBar";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { WhatsAppWidget } from "@/components/shared/WhatsAppWidget";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { CartDrawer } from "@/features/cart/components/CartDrawer";
import { CheckoutHeader } from "@/features/checkout/components/CheckoutHeader";
import { ROUTES } from "@/constants/routes";

// Landing / Shop / PDP get the full "big" footer; every other route gets the slim
// single-row footer per the design references.
const BIG_FOOTER_ROUTES = [ROUTES.HOME, ROUTES.SHOP, ROUTES.PRODUCT];
// Cart / Checkout / PDP host their own sticky bottom action bars (Phases 6–7),
// so the floating bottom nav is suppressed there to avoid stacking two bars.
const NO_BOTTOM_NAV_ROUTES = [ROUTES.CART, ROUTES.CHECKOUT, ROUTES.PRODUCT];

function matchesAny(patterns, pathname) {
  return patterns.some((p) => matchPath({ path: p, end: true }, pathname));
}

export function PublicLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  const { pathname } = useLocation();

  const footerVariant = matchesAny(BIG_FOOTER_ROUTES, pathname) ? "big" : "slim";
  const showBottomNav = !matchesAny(NO_BOTTOM_NAV_ROUTES, pathname);
  // Checkout swaps the storefront nav for its own minimal header (logo · progress
  // stepper · auth actions) per the design.
  const isCheckout = !!matchPath({ path: ROUTES.CHECKOUT, end: true }, pathname);
  // The big footer clears the floating bottom nav itself (its own bottom padding).
  // Only slim-footer pages (footer hidden on mobile) need main to reserve nav space.
  const needsNavClearance = showBottomNav && footerVariant === "slim";

  return (
    <div className="flex min-h-svh flex-col bg-paper text-ink">
      <ScrollToTop />
      <AnnouncementBar />
      {isCheckout ? <CheckoutHeader /> : <SiteHeader onCartClick={() => setCartOpen(true)} />}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />

      <main className={needsNavClearance ? "flex-1 pb-24 md:pb-0" : "flex-1"}>
        <Suspense fallback={<FullPageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      <SiteFooter variant={footerVariant} />
      {showBottomNav && <MobileBottomNav />}
      {/* Chat entry on every storefront page except checkout — that page is
          deliberately stripped to the payment flow (merchant decision). */}
      {!isCheckout && <WhatsAppWidget />}
    </div>
  );
}
