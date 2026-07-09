import { cn } from "@/lib/utils";

const FLOW = ["pending", "confirmed", "packed", "shipped", "delivered"];
const LABELS = { pending: "Pending", confirmed: "Confirmed", packed: "Packed", shipped: "Shipped", delivered: "Delivered" };

export function OrderStatusStepper({ status }) {
  if (status === "cancelled" || status === "refunded") {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
        Order {status === "cancelled" ? "Cancelled" : "Refunded"}
      </div>
    );
  }

  const currentIndex = FLOW.indexOf(status);

  return (
    <ul className="steps steps-vertical sm:steps-horizontal w-full">
      {FLOW.map((step, index) => (
        <li
          key={step}
          data-content={index <= currentIndex ? "✓" : ""}
          className={cn("step", index <= currentIndex && "step-primary")}
        >
          {LABELS[step]}
        </li>
      ))}
    </ul>
  );
}
