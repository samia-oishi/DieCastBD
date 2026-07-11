import { ShieldCheck, Package, Truck, Sparkles, Award, Clock, Heart, Star } from "lucide-react";
import { Container } from "@/components/shared/Container";

// Explicit map (not `import * as Icons`) so bundlers can tree-shake — the full
// lucide-react set is 1000+ icons and importing all of it bloats the bundle for
// no benefit, since WebsiteSettings can only reasonably reference a curated set.
// Exported so the admin Settings editor offers exactly this allow-list, not a
// name that would silently fall back to Sparkles on the live homepage.
export const ICON_MAP = { ShieldCheck, Package, Truck, Sparkles, Award, Clock, Heart, Star };

// "Trust strip" — one joined white card, cells separated by hairline
// dividers (README §Key Components: "wrap-safe — every cell border-top+left,
// container clips first row/col"). Length is whatever the admin configured,
// not hardcoded to 4 — the reference's 4-cell example is the common case,
// not a limit.
export function WhyChooseUsSection({ items }) {
  if (!items?.length) return null;

  return (
    <section className="pt-16">
      <Container>
        <div className="overflow-hidden rounded-[28px] border border-border bg-card">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(195px,1fr))] -m-px">
            {items.map((item) => {
              const Icon = ICON_MAP[item.icon] ?? Sparkles;
              return (
                <div key={item.title} className="flex items-center gap-3.5 border-t border-l border-line-soft p-5.5 sm:gap-4 sm:p-7">
                  <div className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep sm:size-11">
                    <Icon className="size-4 sm:size-4.75" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-foreground sm:text-[14.5px]">{item.title}</div>
                    {item.description && <div className="mt-0.5 text-[11.5px] text-muted-foreground sm:text-[12.5px]">{item.description}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
