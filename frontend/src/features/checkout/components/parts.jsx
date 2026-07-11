import { cn } from "@/lib/utils";

/** Numbered section card (Address / Delivery / Payment). */
export function NumberedCard({ n, title, children, className }) {
  return (
    <div className={cn("rounded-3xl border border-line bg-white p-5 md:p-[26px]", className)}>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-[26px] items-center justify-center rounded-full bg-ink text-[12.5px] font-bold text-white">{n}</span>
        <span className="font-display text-[17px] font-bold text-ink md:text-lg">{title}</span>
      </div>
      {children}
    </div>
  );
}

/** Selectable radio card (delivery zone / payment method). */
export function RadioCard({ selected, onSelect, children, className }) {
  return (
    <div
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect())}
      className={cn(
        "cursor-pointer rounded-2xl border p-4 transition-colors md:p-[16px_18px]",
        selected ? "border-[1.5px] border-brand bg-[#FBFDF3]" : "border-line bg-white hover:border-ink",
        className
      )}
    >
      {children}
    </div>
  );
}

/** The lime filled / grey outline radio dot. */
export function RadioDot({ selected }) {
  return selected ? (
    <span className="mt-0.5 size-[18px] shrink-0 rounded-full border-[5px] border-brand bg-ink" />
  ) : (
    <span className="mt-0.5 size-[18px] shrink-0 rounded-full border-[1.5px] border-[#DDDFD2]" />
  );
}

/** Field label + input styled to the design. */
export function FieldBox({ label, hint, error, children, className }) {
  return (
    <div className={className}>
      <div className="mb-[7px] text-[12.5px] font-semibold text-ink">
        {label} {hint && <span className="font-medium text-faint">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line bg-paper px-4 py-[13px] text-[13.5px] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
