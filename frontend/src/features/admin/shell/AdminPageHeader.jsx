import { cn } from "@/lib/utils";

/** Standard admin page header: optional uppercase eyebrow, H1 (Archivo 800,
 * 24px mobile / 30px desktop), optional subtitle, and right-aligned actions. */
export function AdminPageHeader({ eyebrow, title, subtitle, actions, className }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-faint">{eyebrow}</div>
        )}
        <h1 className="font-display text-[24px] font-extrabold tracking-[-0.015em] text-ink md:text-[30px]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-[#6B6E60]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
