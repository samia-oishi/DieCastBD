import { Star } from "lucide-react";

import { Container } from "@/components/shared/Container";

function Stars({ count = 5 }) {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={15} className="fill-brand text-brand" />
      ))}
    </div>
  );
}

/** "What collectors say" — real admin-managed testimonials in the design card
 * style. Section hides entirely when there are none (no fabricated reviews). */
export function TestimonialsSection({ testimonials }) {
  if (!testimonials?.length) return null;
  return (
    <section className="pt-6 md:pt-[76px]">
      <Container>
        <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-ink md:text-[30px]">What collectors say</h2>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground md:mt-[7px] md:text-[14.5px]">Real orders, real shelves.</p>
        <div className="mt-4 grid gap-4 md:mt-[26px] md:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-[20px] border border-line bg-white p-[18px] md:p-[26px]">
              <Stars count={t.rating || 5} />
              <p className="mt-3 text-[13px] leading-[1.6] text-ink-soft md:mt-3.5 md:text-[15px]">"{t.quote}"</p>
              <div className="mt-3 md:mt-4">
                <span className="text-[13px] font-semibold text-ink md:text-sm">{t.name}</span>
                {t.location && <span className="text-xs text-faint md:text-[12.5px]"> · Verified collector, {t.location}</span>}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
