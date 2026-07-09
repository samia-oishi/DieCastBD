import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const IS_NEGATIVE = new Set(["cancelled", "refunded"]);
const IS_PROGRESSED = new Set(["confirmed", "packed", "shipped", "delivered"]);

export function OrderStatusBadge({ status }) {
  return (
    <Badge
      variant={IS_NEGATIVE.has(status) ? "destructive" : "outline"}
      className={cn(IS_PROGRESSED.has(status) && "border-primary bg-primary/10 text-primary")}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
