import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const FLOW = ["pending", "confirmed", "packed", "shipped", "delivered"];
const LABELS = { pending: "Pending", confirmed: "Confirmed", packed: "Packed", shipped: "Shipped", delivered: "Delivered" };

/** Fulfillment progress tracker — custom Tailwind (replaces the DaisyUI stepper
 * so it hits the reference pixel-for-pixel). Steps up to and including the
 * current status are lime + checked; the rest are hollow rings. Terminal states
 * (cancelled / refunded) show a banner instead of the tracker. */
export function OrderTracker({ status }) {
  if (status === "cancelled" || status === "refunded") {
    return (
      <div className="rounded-[12px] border border-danger/30 bg-danger-soft px-4 py-3 text-[13px] font-semibold text-danger">
        Order {status === "cancelled" ? "cancelled" : "refunded"}
      </div>
    );
  }

  const currentIndex = FLOW.indexOf(status);

  return (
    <ul className="flex items-start">
      {FLOW.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <li key={step} className="flex flex-1 flex-col items-center gap-1.5 md:gap-2">
            <div className="flex w-full items-center">
              <span className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : "bg-line")} />
              <span
                data-done={done}
                className={cn(
                  "box-border flex size-5 flex-none items-center justify-center rounded-full md:size-[26px]",
                  done ? "bg-brand text-ink" : "border-2 border-line bg-white"
                )}
              >
                {done && <Check className="size-2.5 md:size-3.5" strokeWidth={3.2} />}
              </span>
              <span className={cn("h-0.5 flex-1", i === FLOW.length - 1 ? "bg-transparent" : "bg-line")} />
            </div>
            <span className={cn("text-[9px] md:text-[12.5px]", done ? "font-bold text-ink" : "font-semibold text-faint")}>
              {LABELS[step]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
