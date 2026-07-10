import { Link } from "react-router";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OrderStatusStepper } from "@/components/shared/OrderStatusStepper";
import { ROUTES } from "@/constants/routes";
import { OrderStatusBadge } from "./OrderStatusBadge";

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

// The full order display (status, items, address, totals) — shared by the
// authenticated order-detail page (fetches by orderNumber) and the guest-safe
// order-confirmation page (renders straight from the just-placed order object,
// no fetch), so the two never drift apart visually.
export function OrderReceipt({ order }) {
  return (
    <>
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
    </>
  );
}
