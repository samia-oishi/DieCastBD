import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pill quantity stepper — Cart line items, PDP buy panel, Buy Now. Purely
 * controlled: caller owns the value and clamps it (product stock varies by
 * call site, so min/max live with the caller, not baked in here). */
export function QtyStepper({ value, onChange, min = 1, max = Infinity, size = "default", className }) {
  const isSmall = size === "sm";

  return (
    <div className={cn("inline-flex items-center rounded-full border border-border bg-background", className)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={cn(
          "flex items-center justify-center text-foreground disabled:opacity-40",
          isSmall ? "size-8" : "size-9"
        )}
      >
        <Minus className={isSmall ? "size-3" : "size-3.5"} strokeWidth={2.4} />
      </button>
      <span className={cn("min-w-[1.5em] text-center font-semibold tabular-nums", isSmall ? "text-[13px]" : "text-sm")}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={cn(
          "flex items-center justify-center text-foreground disabled:opacity-40",
          isSmall ? "size-8" : "size-9"
        )}
      >
        <Plus className={isSmall ? "size-3" : "size-3.5"} strokeWidth={2.4} />
      </button>
    </div>
  );
}
