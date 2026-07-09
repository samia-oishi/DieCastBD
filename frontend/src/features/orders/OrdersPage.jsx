import { Link } from "react-router";
import { PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/shared/Container";
import { ROUTES } from "@/constants/routes";
import { useMyOrders } from "./api/useOrders";
import { OrderStatusBadge } from "./components/OrderStatusBadge";

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function OrdersPage() {
  const { data: orders, isLoading } = useMyOrders();

  return (
    <Container className="py-10">
      <h1 className="mb-6 font-heading text-3xl text-foreground">My Orders</h1>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && orders?.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <PackageSearch className="size-10 text-muted-foreground/40" strokeWidth={1.25} />
          <p className="text-muted-foreground">No orders yet.</p>
          <Button asChild size="sm">
            <Link to={ROUTES.SHOP}>Browse the collection</Link>
          </Button>
        </div>
      )}

      {!isLoading && orders?.length > 0 && (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order.orderNumber}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:border-foreground/40"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 && "s"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{formatPrice(order.total)}</span>
                <OrderStatusBadge status={order.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
