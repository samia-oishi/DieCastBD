import { cn } from "@/lib/utils";

/* Radii are explicit px on purpose — index.css redefines the Tailwind radius
 * scale, so named rounded-* utilities do NOT equal the design's values. */

/** Numbered section card. Mobile: 16px radius / 16px padding, 22px step badge,
 * 15px title. Desktop: 20px radius / 22px·26px padding, 24px badge, 17px title. */
export function SectionCard({ n, title, aside, children, className }) {
  return (
    <div className={cn("rounded-[16px] border border-line bg-white p-4 md:rounded-[20px] md:px-[26px] md:py-[22px]", className)}>
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 md:gap-3">
          <span className="inline-flex size-[22px] items-center justify-center rounded-full bg-ink text-[11.5px] font-bold text-white md:size-6 md:text-[12.5px]">
            {n}
          </span>
          <span className="font-display text-[15px] font-bold text-ink md:text-[17px]">{title}</span>
        </div>
        {aside}
      </div>
      {children}
    </div>
  );
}

/** Selection radio — 18px, border-box. Selected: 5.5px ink ring on lime.
 * Unselected: 1.5px #C9CBBE. Disabled: 1.5px #DEDFD6. */
export function Radio({ selected, disabled }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-px box-border size-[18px] shrink-0 rounded-full",
        selected
          ? "border-[5.5px] border-ink bg-brand"
          : cn("border-[1.5px] bg-white", disabled ? "border-[#DEDFD6]" : "border-[#C9CBBE]")
      )}
    />
  );
}

/** Selectable option card (payment method row / delivery zone / pay plan).
 * Selected: 1.5px lime + rgba(168,205,47,.07). Plan cards instead use a 2px ink
 * border on #FAFAF7. Locked: dashed, not-allowed. */
export function OptionCard({ selected, disabled, locked, onSelect, variant = "method", children, className }) {
  const radius = variant === "method" ? "rounded-[16px]" : "rounded-[14px]";
  const pad =
    variant === "method" ? "px-[18px] py-[15px]" : variant === "zone" ? "px-4 py-[13px]" : "px-[15px] py-[13px]";

  const surface = locked
    ? "border border-dashed border-[#DEDFD6] bg-[#FAFAF7] cursor-not-allowed"
    : variant === "plan"
      ? selected
        ? "border-2 border-ink bg-[#FAFAF7] cursor-pointer"
        : "border border-line bg-white cursor-pointer hover:border-[#C9CBBE]"
      : selected
        ? "border-[1.5px] border-brand bg-[rgba(168,205,47,0.07)] cursor-pointer"
        : "border border-line bg-white cursor-pointer hover:border-[#C9CBBE]";

  const interactive = !locked && !disabled;

  return (
    <div
      onClick={interactive ? onSelect : undefined}
      role="radio"
      aria-checked={Boolean(selected)}
      aria-disabled={locked || disabled || undefined}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={cn("transition-colors duration-150", radius, pad, surface, className)}
    >
      {children}
    </div>
  );
}

/** Small uppercase eyebrow (11–12px, 700, tracked, #8A8D80). */
export function Eyebrow({ children, className }) {
  return (
    <div className={cn("text-xs font-bold uppercase tracking-[0.06em] text-faint", className)}>{children}</div>
  );
}

/** Field label + control. */
export function FieldBox({ label, hint, error, children, className }) {
  return (
    <div className={className}>
      <div className="mb-1.5 text-[12.5px] font-bold text-ink">
        {label} {hint && <span className="font-medium text-faint">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

export const inputCls =
  "w-full rounded-[12px] border border-line bg-white px-[14px] py-3 text-base leading-[1.35] text-ink placeholder:text-[#A2A499] focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-brand md:text-sm";
