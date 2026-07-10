import { useState } from "react";
import { useParams, Link } from "react-router";
import { ChevronLeft, MapPin } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { OrderStatusStepper } from "@/components/shared/OrderStatusStepper";
import { useAdminOrder, useUpdateOrderStatusMutation } from "./api/useAdminOrders";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";

const STATUS_OPTIONS = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"];

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OrderDetailPage() {
  const { id } = useParams();
  const { data: order, isLoading } = useAdminOrder(id);
  const updateMutation = useUpdateOrderStatusMutation();

  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierName, setCourierName] = useState("");

  if (isLoading || !order) return <FullPageLoader />;

  const onUpdateStatus = () => {
    if (!nextStatus) return;
    updateMutation.mutate(
      { id, payload: { status: nextStatus, note: note || undefined, trackingNumber: trackingNumber || undefined, courierName: courierName || undefined } },
      {
        onSuccess: () => {
          toast.success("Order status updated");
          setNextStatus("");
          setNote("");
          setTrackingNumber("");
          setCourierName("");
        },
        onError: (err) => toast.error(err.response?.data?.message ?? "Could not update order"),
      }
    );
  };

  const isTerminal = order.status === "cancelled" || order.status === "refunded";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-16">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="..">
          <ChevronLeft /> Back to orders
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {order.user?.name} · {order.user?.email} · Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border p-4">
        <OrderStatusStepper status={order.status} />
      </div>

      {order.trackingNumber && (
        <div className="rounded-lg border border-border p-4 text-sm">
          <span className="text-muted-foreground">Tracking:</span> {order.trackingNumber}
          {order.courierName && <span className="text-muted-foreground"> via {order.courierName}</span>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-lg">Items</h2>
          {order.items.map((item) => (
            <div key={item.sku} className="flex justify-between text-sm">
              <span>
                {item.title} <span className="text-muted-foreground">× {item.qty}</span>
              </span>
              <span>{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="mt-2 flex flex-col gap-1 border-t border-border pt-3 text-sm">
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
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {order.paymentMethod === "cod" ? "Cash on Delivery" : "bKash"}
            {order.paymentMethod === "bkash" && order.bkashTransactionId && (
              <> — Transaction ID: <span className="font-medium text-foreground">{order.bkashTransactionId}</span></>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="mb-2 flex items-center gap-1.5 font-heading text-lg">
              <MapPin className="size-4" /> Shipping Address
            </h2>
            <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{order.shippingAddress.recipientName}</p>
              <p>
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`},{" "}
                {order.shippingAddress.city}
                {order.shippingAddress.district && `, ${order.shippingAddress.district}`}
              </p>
              <p>{order.shippingAddress.phone}</p>
              {order.deliveryNote && <p className="mt-1">Note: {order.deliveryNote}</p>}
            </div>
          </div>

          <div>
            <h2 className="mb-2 font-heading text-lg">Status History</h2>
            <div className="flex flex-col gap-2 text-sm">
              {order.statusHistory.map((entry, i) => (
                <div key={i} className="flex justify-between border-b border-border pb-1.5 text-muted-foreground">
                  <span className="capitalize text-foreground">{entry.status}</span>
                  <span>{formatDateTime(entry.at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!isTerminal && (
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-3 font-heading text-lg">Update Status</h2>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>New status</FieldLabel>
                <Select value={nextStatus} onValueChange={setNextStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.filter((s) => s !== order.status).map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Note (optional)</FieldLabel>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
            </div>

            {nextStatus === "shipped" && (
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Tracking number</FieldLabel>
                  <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel>Courier</FieldLabel>
                  <Input value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="Pathao, Sundarban..." />
                </Field>
              </div>
            )}

            <Button onClick={onUpdateStatus} disabled={!nextStatus || updateMutation.isPending} className="w-fit">
              {updateMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </FieldGroup>
        </div>
      )}
    </div>
  );
}
