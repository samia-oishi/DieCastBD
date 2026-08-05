import { Star } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { useDragScroll } from "@/hooks/useDragScroll";

function Stars({ size }) {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className="fill-brand text-brand" />
      ))}
    </div>
  );
}

/** "What collectors say" — real admin-managed testimonials. Mobile: horizontal
 * drag carousel of 280px cards. Desktop: grid. Section hides when empty. */
const SKEL_CLS = "animate-pulse rounded-[18px] bg-line-soft md:rounded-[20px]";

export function TestimonialsSection({ testimonials, isLoading }) {
  const { ref, dragProps } = useDragScroll();
  // Reserve space while settings load; a store with no testimonials collected
  // yet still renders nothing, which is the intended empty state.
  if (isLoading) {
    return (
      <section className="pt-[26px] md:pt-[76px]">
        <Container>
          <div className={`h-[180px] ${SKEL_CLS} md:h-[240px]`} />
        </Container>
      </section>
    );
  }
  if (!testimonials?.length) return null;

  return (
    <section className="pt-[26px] md:pt-[76px]">
      <Container>
        <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-ink md:text-[30px]">What collectors say</h2>
        <p className="mt-[7px] hidden text-[14.5px] text-muted-foreground md:block">Real orders, real shelves.</p>
      </Container>

      {/* Mobile: drag carousel */}
      <div ref={ref} {...dragProps} className="mt-3 flex snap-x snap-proximity gap-3 scroll-pl-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
        {testimonials.map((t, i) => (
          <div key={i} className="w-[280px] shrink-0 snap-start rounded-[18px] border border-line bg-white p-[18px]">
            <Stars size={13} />
            <p className="mt-2.5 text-[13px] leading-[1.55] text-ink-soft">"{t.quote}"</p>
            <div className="mt-2.5 text-xs">
              <span className="font-semibold text-ink">{t.name}</span>
              {t.location && <span className="text-faint"> · {t.location}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: grid */}
      <Container className="mt-[26px] hidden md:block">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-[20px] border border-line bg-white p-[26px]">
              <Stars size={15} />
              <p className="mt-3.5 text-[15px] leading-[1.6] text-ink-soft">"{t.quote}"</p>
              <div className="mt-4">
                <span className="text-sm font-semibold text-ink">{t.name}</span>
                {t.location && <span className="text-[12.5px] text-faint"> · Verified collector, {t.location}</span>}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
