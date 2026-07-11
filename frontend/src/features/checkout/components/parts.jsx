import { cn } from "@/lib/utils";

/** Numbered section card (Address / Delivery / Payment). Radius/padding follow
 * the design per breakpoint: 18px·18px on mobile, 24px·26px on desktop. */
export function NumberedCard({ n, title, children, className }) {
  return (
    <div className={cn("rounded-[18px] border border-line bg-white p-[18px] md:rounded-[24px] md:p-[26px]", className)}>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-[22px] items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white md:size-[26px] md:text-[12.5px]">{n}</span>
        <span className="font-display text-[15.5px] font-bold text-ink md:text-lg">{title}</span>
      </div>
      {children}
    </div>
  );
}

/** Selectable radio card (delivery zone / payment method). Radius/padding per
 * breakpoint: 14px·13/14 on mobile, 16px·16/18 on desktop. */
export function RadioCard({ selected, onSelect, children, className }) {
  return (
    <div
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect())}
      className={cn(
        "cursor-pointer rounded-[14px] border px-3.5 py-[13px] transition-colors md:rounded-[16px] md:px-[18px] md:py-4",
        selected ? "border-[1.5px] border-brand bg-[#FBFDF3]" : "border-line bg-white hover:border-ink",
        className
      )}
    >
      {children}
    </div>
  );
}

/** The lime-filled / grey-outline radio dot. Sizes match the design's
 * content-box dots: selected is a chunky filled dot (25px mobile / 28px desktop,
 * with a thick lime ring + ink centre), unselected a lighter hollow ring
 * (19px mobile / 21px desktop). */
export function RadioDot({ selected }) {
  return selected ? (
    <span className="mt-px size-[25px] shrink-0 rounded-full border-[4.5px] border-brand bg-ink md:size-[28px] md:border-[5px]" />
  ) : (
    <span className="mt-px size-[19px] shrink-0 rounded-full border-[1.5px] border-[#DDDFD2] md:size-[21px]" />
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
  "w-full rounded-[12px] border border-line bg-paper px-4 py-[13px] text-[13.5px] leading-[1.2] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
