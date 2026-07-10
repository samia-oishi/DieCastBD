import { useParams } from "react-router";
import { CheckCircle2 } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { NotFoundPage } from "@/components/shared/NotFoundPage";
import { useOrder } from "./api/useOrders";
import { OrderReceipt } from "./components/OrderReceipt";

export function OrderDetailPage() {
  const { orderNumber } = useParams();
  const { data: order, isLoading, isError } = useOrder(orderNumber);

  if (isLoading) return <FullPageLoader />;
  if (isError || !order) return <NotFoundPage />;

  const justPlaced = order.status === "pending" && order.statusHistory.length === 1;

  return (
    <Container className="py-10">
      {justPlaced && (
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <CheckCircle2 className="size-10 text-primary" strokeWidth={1.5} />
          <h1 className="font-heading text-2xl text-foreground">Order placed</h1>
          <p className="text-sm text-muted-foreground">
            We've emailed a confirmation to your inbox. We'll notify you as your order moves through
            fulfillment.
          </p>
        </div>
      )}

      <OrderReceipt order={order} />
    </Container>
  );
}
