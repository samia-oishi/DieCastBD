import { cn } from "@/lib/utils";

/** Horizontal filter-chip row. `chips` = [{ value, label, count? }]. Active chip
 * is an ink pill; counts render in a small inner badge. Scrolls on overflow. */
export function FilterChips({ chips, value, onChange, className }) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      {chips.map((chip) => {
        const active = value === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onChange(chip.value)}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold transition-colors duration-150",
              active ? "bg-ink text-white" : "border border-line bg-white text-ink-soft hover:bg-tile"
            )}
          >
            {chip.label}
            {chip.count != null && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[10.5px] font-bold tabular-nums",
                  active ? "bg-white/20 text-white" : "bg-tile text-faint"
                )}
              >
                {chip.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
