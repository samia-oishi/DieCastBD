import { useParams, Link } from "react-router";
import { CheckCircle2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { NotFoundPage } from "@/components/shared/NotFoundPage";
import { OrderStatusStepper } from "@/components/shared/OrderStatusStepper";
import { ROUTES } from "@/constants/routes";
import { useOrder } from "./api/useOrders";
import { OrderStatusBadge } from "./components/OrderStatusBadge";

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl text-foreground">Order {order.orderNumber}</h2>
          <p className="text-sm text-muted-foreground">Placed {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mb-8 overflow-x-auto rounded-lg border border-border p-4">
        <OrderStatusStepper status={order.status} />
      </div>

      {order.trackingNumber && (
        <div className="mb-8 rounded-lg border border-border p-4 text-sm">
          <span className="text-muted-foreground">Tracking number:</span>{" "}
          <span className="font-medium text-foreground">{order.trackingNumber}</span>
          {order.courierName && <span className="text-muted-foreground"> via {order.courierName}</span>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {order.items.map((item) => (
            <div key={item.sku} className="flex justify-between text-sm">
              <span className="text-foreground">
                {item.title} <span className="text-muted-foreground">× {item.qty}</span>
              </span>
              <span className="text-foreground">{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-border p-4 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">{order.shippingAddress.recipientName}</p>
              <p className="text-muted-foreground">
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`},{" "}
                {order.shippingAddress.city}
                {order.shippingAddress.district && `, ${order.shippingAddress.district}`}
              </p>
              <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
              {order.deliveryNote && <p className="mt-1 text-muted-foreground">Note: {order.deliveryNote}</p>}
            </div>
          </div>
        </div>

        <div className="flex h-fit flex-col gap-2 rounded-xl border border-border p-6 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-primary">
              <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span>{order.shippingFee > 0 ? formatPrice(order.shippingFee) : "Free"}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {order.paymentMethod === "cod" ? "Cash on Delivery" : "bKash"}
          </p>

          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to={ROUTES.SHOP}>Continue shopping</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
