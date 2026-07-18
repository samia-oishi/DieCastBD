import { cn } from "@/lib/utils";

/** KPI stat tile (Dashboard, Inventory, Reports). White card, label + tinted
 * icon, Archivo-800 value, optional sub caption and delta pill. `tone` colors
 * the icon + value emphasis; `delta` is omitted unless the caller has a real
 * comparison to show (never fabricated). */
const TONES = {
  default: "text-ink-soft",
  lime: "text-brand-deep",
  amber: "text-[#B45309]",
  red: "text-[#B3261E]",
  teal: "text-[#0E7490]",
};

export function KpiCard({ icon: Icon, label, value, sub, tone = "default", delta, className }) {
  return (
    <div className={cn("rounded-[16px] border border-line bg-white p-[18px]", className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={15} strokeWidth={2} className={TONES[tone]} />}
        <span className="text-[12px] font-semibold text-[#6B6E60]">{label}</span>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="font-display text-[26px] font-extrabold leading-none tracking-[-0.02em] text-ink">
          {value}
        </span>
        {delta}
      </div>
      {sub && <div className="mt-1.5 text-[11.5px] text-faint">{sub}</div>}
    </div>
  );
}
