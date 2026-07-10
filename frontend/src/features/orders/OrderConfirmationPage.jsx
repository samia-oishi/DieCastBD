import { useLocation, Navigate } from "react-router";
import { CheckCircle2 } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { ROUTES } from "@/constants/routes";
import { OrderReceipt } from "./components/OrderReceipt";

// Public (not behind ProtectedRoute) — the one moment a guest needs to see an
// order without a session. Renders straight from the order the create-order
// mutation just returned via router state; never fetches, since a guest has no
// session to authenticate a lookup with. A logged-in customer's permanent order
// history/detail stays on the separate, authenticated OrderDetailPage — this
// page only exists for the instant right after checkout.
export function OrderConfirmationPage() {
  const location = useLocation();
  const order = location.state?.order;

  if (!order) return <Navigate to={ROUTES.HOME} replace />;

  return (
    <Container className="py-10">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <CheckCircle2 className="size-10 text-primary" strokeWidth={1.5} />
        <h1 className="font-heading text-2xl text-foreground">Order placed</h1>
        <p className="text-sm text-muted-foreground">
          We've emailed a confirmation to your inbox. We'll notify you as your order moves through
          fulfillment.
        </p>
      </div>

      <OrderReceipt order={order} />
    </Container>
  );
}
