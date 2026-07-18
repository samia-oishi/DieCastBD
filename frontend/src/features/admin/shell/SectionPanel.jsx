import { cn } from "@/lib/utils";

/** White content card used across admin screens. Optional header (title +
 * optional right-aligned action + optional description). Body is `children`.
 * `bodyClassName` lets callers control padding (e.g. tables that go edge-to-edge
 * pass `p-0` and manage their own). */
export function SectionPanel({ title, description, action, children, className, bodyClassName }) {
  const hasHeader = title || action || description;
  return (
    <section className={cn("rounded-[18px] border border-line bg-white", className)}>
      {hasHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3 px-[22px] pt-[18px]">
          <div className="min-w-0">
            {title && <h2 className="font-display text-[15.5px] font-bold text-ink md:text-[17px]">{title}</h2>}
            {description && <p className="mt-1 text-[12.5px] text-[#6B6E60]">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn(hasHeader ? "p-[22px] pt-[16px]" : "p-[22px]", bodyClassName)}>{children}</div>
    </section>
  );
}
