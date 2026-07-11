import { cn } from "@/lib/utils";

const LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

// Only Pending/Delivered/Cancelled/Refunded appear as chip examples in the
// design references (My Orders.dc.html) — confirmed/packed/shipped are all
// "moving forward normally" and share Delivered's lime-deep treatment rather
// than inventing three more distinct tones the design never specifies; the
// OrderTracker step position (not this chip) is what actually distinguishes
// them for the customer.
const TONE_CLASS = {
  pending: "bg-[#F7EAD6] text-warn",
  confirmed: "bg-brand-soft text-brand-deep",
  packed: "bg-brand-soft text-brand-deep",
  shipped: "bg-brand-soft text-brand-deep",
  delivered: "bg-brand-soft text-brand-deep",
  cancelled: "bg-[#F9E3E1] text-danger",
  refunded: "bg-[#F9E3E1] text-danger",
};

export function StatusChip({ status, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11.5px] font-bold whitespace-nowrap",
        TONE_CLASS[status] ?? "bg-secondary text-muted-foreground",
        className
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
