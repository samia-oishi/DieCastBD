import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { ROUTES } from "@/constants/routes";

const DEFAULT_TITLE = "Limited runs. Real metal. Gone fast.";
const DEFAULT_DESCRIPTION =
  "Premium castings reach Bangladesh in one batch. When a piece sells through, it's retired — no reprints, no restocks.";

// "The Premium Shelf" dark banner. No image field exists on
// Settings.collectorPromise (title/description only) — rather than fabricate
// a product photo, the image slot renders as the same dashed "not yet
// configured" placeholder treatment the reference itself uses for an empty
// image-slot, so the panel is honest about having no real photo yet instead
// of faking one.
export function CollectorPromiseSection({ title, description }) {
  return (
    <section className="pt-16">
      <Container>
        <div className="grid items-center gap-8 rounded-3xl bg-ink p-6 sm:gap-14 md:grid-cols-[1fr_1fr] md:rounded-[28px] md:p-16">
          <div>
            <div className="text-[10.5px] font-bold tracking-[.13em] text-brand sm:text-xs sm:tracking-[.14em]">THE PREMIUM SHELF</div>
            <h2 className="mt-2.5 font-display text-2xl leading-[1.12] font-extrabold tracking-[-0.015em] text-white sm:mt-4 sm:text-[clamp(32px,3vw,42px)] sm:leading-[1.1]">
              {title || DEFAULT_TITLE}
            </h2>
            <p className="mt-2.5 max-w-110 text-sm leading-[1.65] text-[#A9AC9F] sm:mt-4.5 sm:text-base">
              {description || DEFAULT_DESCRIPTION}
            </p>
            <Link
              to={ROUTES.SHOP}
              className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-brand px-5 py-3 text-[13.5px] font-bold text-ink transition-colors hover:bg-brand-bright sm:mt-7 sm:px-7 sm:py-3.75 sm:text-[15px]"
            >
              Shop featured
              <ArrowRight className="size-3.5 sm:size-4" />
            </Link>
          </div>
          <div className="h-37.5 rounded-3xl border-[1.5px] border-dashed border-white/25 bg-white/5 sm:h-95 md:rounded-[20px]" />
        </div>
      </Container>
    </section>
  );
}
