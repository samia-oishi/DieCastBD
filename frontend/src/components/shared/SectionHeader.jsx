import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

/** Section title + optional subtitle + optional "View all" link. Matches the
 * design's section headers (desktop 30px Archivo title with lime-underline
 * link; mobile 20px title with a compact lime link). */
export function SectionHeader({ title, subtitle, viewAllHref, viewAllLabel = "View all" }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-ink md:text-[30px]">{title}</h2>
        {subtitle && <p className="mt-1.5 text-[13.5px] text-muted-foreground md:mt-[7px] md:text-[14.5px]">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link
          to={viewAllHref}
          className="shrink-0 pb-[3px] text-[12.5px] font-semibold text-brand-deep md:inline-flex md:items-center md:gap-2 md:border-b-2 md:border-brand md:text-[14.5px] md:text-ink"
        >
          {viewAllLabel}
          <ArrowRight className="hidden size-[15px] md:block" strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}
