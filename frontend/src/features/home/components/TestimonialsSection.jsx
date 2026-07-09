import { Star } from "lucide-react";
import { Container } from "@/components/shared/Container";

// Hidden entirely until real reviews exist — no fabricated testimonials.
export function TestimonialsSection({ testimonials }) {
  if (!testimonials?.length) return null;

  return (
    <section className="border-t border-border bg-card/40 py-16">
      <Container>
        <h2 className="mb-10 text-center font-heading text-2xl text-foreground sm:text-3xl">
          What Collectors Say
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="flex flex-col gap-3 rounded-xl border border-border p-6">
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
              <span className="text-sm font-medium text-foreground">{t.name}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
