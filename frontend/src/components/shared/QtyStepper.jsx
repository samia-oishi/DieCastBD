import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  md: { box: "h-11", btn: "size-11", icon: 16, text: "text-sm min-w-9" },
  sm: { box: "h-9", btn: "size-9", icon: 14, text: "text-[13px] min-w-8" },
};

/** Controlled quantity stepper used across PDP, cart lines, and sticky bars.
 * Clamps to [min, max]; buttons keep >=44px touch targets at `md`. */
export function QtyStepper({ value, onChange, min = 1, max = Infinity, size = "md", disabled = false, className }) {
  const s = SIZES[size] ?? SIZES.md;
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className={cn("inline-flex items-center rounded-full border border-line bg-white", s.box, className)}>
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className={cn("flex items-center justify-center rounded-full text-ink transition-colors hover:text-brand-deep disabled:opacity-30", s.btn)}
      >
        <Minus size={s.icon} strokeWidth={2.2} />
      </button>
      <span className={cn("text-center font-semibold text-ink tabular-nums", s.text)}>{value}</span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className={cn("flex items-center justify-center rounded-full text-ink transition-colors hover:text-brand-deep disabled:opacity-30", s.btn)}
      >
        <Plus size={s.icon} strokeWidth={2.2} />
      </button>
    </div>
  );
}
