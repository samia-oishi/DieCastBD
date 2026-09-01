import { cn } from "@/lib/utils";

/** Steadfast's own delivery_status, shown verbatim in our chip language.
 *
 * The four *_approval_pending states are the ones that matter operationally:
 * the courier is waiting on the merchant to confirm a delivery, a partial
 * delivery, or a cancellation. They are styled as needing attention (amber)
 * rather than as done, because treating "delivered_approval_pending" like
 * "delivered" is exactly how money goes uncollected.
 */
const STYLES = {
  pending: { bg: "#EFEFE9", color: "#3A3D33", label: "Pending" },
  in_review: { bg: "#EFEFE9", color: "#3A3D33", label: "In review" },
  hold: { bg: "#F7EAD6", color: "#B45309", label: "On hold" },
  delivered: { bg: "#EFF5DC", color: "#4F6B0B", label: "Delivered" },
  partial_delivered: { bg: "#EFF5DC", color: "#4F6B0B", label: "Partly delivered" },
  cancelled: { bg: "#F9E3E1", color: "#B3261E", label: "Cancelled" },
  unknown: { bg: "#EFEFE9", color: "#6B6E60", label: "Unknown" },
  delivered_approval_pending: { bg: "#F7EAD6", color: "#B45309", label: "Confirm delivery" },
  partial_delivered_approval_pending: { bg: "#F7EAD6", color: "#B45309", label: "Confirm partial" },
  cancelled_approval_pending: { bg: "#F7EAD6", color: "#B45309", label: "Confirm cancel" },
  unknown_approval_pending: { bg: "#F7EAD6", color: "#B45309", label: "Needs review" },
};

const SIZES = { md: "text-[11.5px] px-3 py-[5px]", sm: "text-[10.5px] px-[11px] py-[5px]" };

export function CourierChip({ status, size = "sm", className }) {
  if (!status) return null;
  // An unrecognised status still shows: Steadfast could add one, and a blank
  // cell would read as "not sent" — the opposite of the truth.
  const s = STYLES[status] ?? { bg: "#EFEFE9", color: "#3A3D33", label: status.replace(/_/g, " ") };
  return (
    <span
      className={cn("inline-flex items-center rounded-full font-bold", SIZES[size], className)}
      style={{ backgroundColor: s.bg, color: s.color }}
      title={`Steadfast: ${status}`}
    >
      {s.label}
    </span>
  );
}
