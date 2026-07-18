import { forwardRef } from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

// Admin button system per the redesign spec. Pills, Archivo 700.
//   primary  — lime pill, ink text (hover brand-bright)
//   outline  — 1.5px ink outline (hover inverts to ink fill / white)
//   ghost    — transparent, muted (hover tile)
//   danger   — red fill (#E5484D, hover #F16A6E)
//   glass    — for the dark-glass bars (save/bulk): white-25% outline on dark
// `asChild` renders onto a child (e.g. a router <Link>) via Radix Slot.
const VARIANTS = {
  primary: "bg-brand text-ink hover:bg-brand-bright",
  outline: "border-[1.5px] border-ink text-ink hover:bg-ink hover:text-white",
  ghost: "text-ink-soft hover:bg-tile",
  danger: "bg-[#E5484D] text-white hover:bg-[#F16A6E]",
  glass: "border border-white/25 text-[#DDDFD2] hover:bg-white/10",
};

const SIZES = {
  md: "h-10 px-4 text-[13px]",
  sm: "h-9 px-3.5 text-[12.5px]",
};

export const AdminButton = forwardRef(function AdminButton(
  { variant = "primary", size = "md", asChild, className, ...props },
  ref
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-display font-bold transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
});
