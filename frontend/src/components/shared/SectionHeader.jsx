import { Link } from "react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

function ArrowButton({ onClick, disabled, direction, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-10.5 items-center justify-center rounded-full border border-line-soft bg-card text-foreground transition-colors hover:border-foreground disabled:opacity-40 disabled:hover:border-line-soft"
    >
      {direction === "prev" ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
    </button>
  );
}

/** Title + subtitle + optional "View all" link + optional prev/next arrow
 * pair — the recurring header above every carousel/section on Home and
 * similar listing sections (README §Key Components). */
export function SectionHeader({ title, subtitle, seeAllHref, seeAllLabel = "View all", onPrev, onNext, canPrev = true, canNext = true }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <h2 className="font-display text-[30px] font-bold tracking-[-0.01em] text-foreground">{title}</h2>
        {subtitle && <p className="mt-1.5 text-[14.5px] text-muted-2">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {seeAllHref && (
          <Link
            to={seeAllHref}
            className="inline-flex items-center gap-2 border-b-2 border-brand pb-0.75 text-[14.5px] font-semibold text-foreground"
          >
            {seeAllLabel}
            <ArrowRight className="size-3.75" />
          </Link>
        )}
        {(onPrev || onNext) && (
          <div className="hidden gap-2.5 sm:flex">
            <ArrowButton onClick={onPrev} disabled={!canPrev} direction="prev" label="Previous" />
            <ArrowButton onClick={onNext} disabled={!canNext} direction="next" label="Next" />
          </div>
        )}
      </div>
    </div>
  );
}
