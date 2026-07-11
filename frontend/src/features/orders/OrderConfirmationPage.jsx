import { useLocation, Navigate } from "react-router";
import { Check } from "lucide-react";

import { Seo } from "@/components/shared/Seo";
import { ROUTES } from "@/constants/routes";
import { OrderReceipt } from "./components/OrderReceipt";

/** Success header shown above the receipt right after checkout. */
export function OrderSuccessHeader() {
  return (
    <div className="text-center">
      <div className="inline-flex size-16 items-center justify-center rounded-full bg-brand text-ink shadow-[0_10px_30px_rgba(168,205,47,0.4)] md:size-[68px]">
        <Check className="size-6 md:size-[30px]" strokeWidth={2.6} />
      </div>
      <h1 className="mt-4 font-display text-[25px] font-extrabold tracking-[-0.01em] text-ink md:mt-5 md:text-[36px] md:tracking-[-0.02em]">
        Order placed — nice pick.
      </h1>
      <p className="mx-auto mt-2 max-w-[520px] text-[13px] leading-[1.55] text-muted-foreground md:mt-2.5 md:text-[15px]">
        Confirmation is in your inbox. We'll message you at every step until it's on your shelf.
      </p>
    </div>
  );
}

// Public (not behind ProtectedRoute) — the one moment a guest needs to see an
// order without a session. Renders straight from the order the create-order
// mutation just returned via router state; never fetches, since a guest has no
// session to authenticate a lookup with. A logged-in customer's permanent order
// history/detail lives on the authenticated OrderDetailPage.
export function OrderConfirmationPage() {
  const location = useLocation();
  const order = location.state?.order;

  if (!order) return <Navigate to={ROUTES.HOME} replace />;

  return (
    <>
      <Seo title="Order placed" />
      <div className="mx-auto w-full max-w-[1060px] px-4 pb-6 pt-7 md:px-10 md:pb-10 md:pt-[52px]">
        <OrderSuccessHeader />
        <div className="mt-6 md:mt-8">
          <OrderReceipt order={order} />
        </div>
      </div>
    </>
  );
}
