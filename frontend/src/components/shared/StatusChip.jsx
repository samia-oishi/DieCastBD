import { cn } from "@/lib/utils";

// Exact chip colors from the My Orders reference. Intermediate fulfillment
// states (confirmed/packed/shipped) use a neutral ink chip since the design
// only defines amber/lime/red for pending/delivered/cancelled+refunded.
const STATUS_STYLES = {
  pending: { bg: "#F7EAD6", color: "#B45309", label: "Pending" },
  confirmed: { bg: "#EFEFE9", color: "#3A3D33", label: "Confirmed" },
  packed: { bg: "#EFEFE9", color: "#3A3D33", label: "Packed" },
  shipped: { bg: "#EFEFE9", color: "#3A3D33", label: "Shipped" },
  delivered: { bg: "#EFF5DC", color: "#4F6B0B", label: "Delivered" },
  cancelled: { bg: "#F9E3E1", color: "#B3261E", label: "Cancelled" },
  refunded: { bg: "#F9E3E1", color: "#B3261E", label: "Refunded" },
};

const SIZES = {
  md: "text-[11.5px] px-3 py-[5px]",
  sm: "text-[10.5px] px-[11px] py-[5px]",
};

export function StatusChip({ status, size = "md", className }) {
  const s = STATUS_STYLES[status] ?? { bg: "#EFEFE9", color: "#3A3D33", label: status };
  return (
    <span
      className={cn("inline-flex items-center rounded-full font-bold", SIZES[size], className)}
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}
