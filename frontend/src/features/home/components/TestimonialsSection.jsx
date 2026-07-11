import { Star } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";

function TestimonialCard({ testimonial, className }) {
  return (
    <div className={`rounded-[18px] border border-border bg-card p-4.5 md:rounded-[20px] md:p-6.5 ${className ?? ""}`}>
      <div className="flex gap-0.75 text-brand">
        {Array.from({ length: testimonial.rating ?? 5 }).map((_, i) => (
          <Star key={i} className="size-3.25 fill-current md:size-3.75" />
        ))}
      </div>
      <p className="mt-2.5 text-[13px] leading-[1.55] text-ink-soft md:mt-3.5 md:text-[15px] md:leading-[1.6]">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="mt-2.5 text-xs md:mt-4 md:text-sm">
        <span className="font-semibold text-foreground">{testimonial.name}</span>
      </div>
    </div>
  );
}

// Hidden entirely until real reviews exist — no fabricated testimonials.
// The design shows a plain name + location ("Rafid H. · Verified collector,
// Dhaka"), but Settings.testimonials only stores {name, quote, rating} — no
// location field — so only the real name renders, rather than inventing one.
export function TestimonialsSection({ testimonials }) {
  if (!testimonials?.length) return null;

  return (
    <section className="pt-6.5 md:pt-19">
      <Container className="hidden md:block">
        <SectionHeader title="What collectors say" subtitle="Real orders, real shelves." />
        <div className="mt-6.5 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} testimonial={t} />
          ))}
        </div>
      </Container>

      <div className="md:hidden">
        <div className="mb-3 px-4 font-display text-xl font-bold">What collectors say</div>
        <div className="scrollbar-none flex snap-x snap-proximity gap-3 overflow-x-auto scroll-pl-4 px-4 pb-1">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} testimonial={t} className="w-70 shrink-0 snap-start" />
          ))}
        </div>
      </div>
    </section>
  );
}
