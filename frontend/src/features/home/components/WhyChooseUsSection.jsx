import { ShieldCheck, Package, Truck, Sparkles, Award, Clock, Heart, Star } from "lucide-react";
import { Container } from "@/components/shared/Container";

// Explicit map (not `import * as Icons`) so bundlers can tree-shake — the full
// lucide-react set is 1000+ icons and importing all of it bloats the bundle for
// no benefit, since WebsiteSettings can only reasonably reference a curated set.
// Exported so the admin Settings editor offers exactly this allow-list, not a
// name that would silently fall back to Sparkles on the live homepage.
export const ICON_MAP = { ShieldCheck, Package, Truck, Sparkles, Award, Clock, Heart, Star };

export function WhyChooseUsSection({ items }) {
  if (!items?.length) return null;

  return (
    <section className="border-t border-border bg-card/40 py-16">
      <Container>
        <h2 className="mb-10 text-center font-heading text-2xl text-foreground sm:text-3xl">Why Choose DiecastBD</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? Sparkles;
            return (
              <div key={item.title} className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-6" strokeWidth={1.5} />
                </div>
                <h3 className="font-medium text-foreground">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
