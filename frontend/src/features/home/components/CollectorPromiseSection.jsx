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
// of faking one. The reference's mobile layout drops the description
// paragraph entirely and puts the image between the headline and the CTA
// (not after it, as a naive single DOM order would give both breakpoints) —
// handled here with two responsive-only image placeholders rather than
// fighting CSS grid ordering for a single decorative box.
export function CollectorPromiseSection({ title, description }) {
  return (
    <section className="pt-6 md:pt-19">
      <Container>
        <div className="grid items-center gap-8 rounded-[24px] bg-ink p-6 md:grid-cols-[1fr_1fr] md:gap-14 md:rounded-[28px] md:p-16">
          <div>
            <div className="text-[10.5px] font-bold tracking-[.13em] text-brand md:text-xs md:tracking-[.14em]">THE PREMIUM SHELF</div>
            <h2 className="mt-2.5 font-display text-2xl leading-[1.12] font-extrabold tracking-[-0.015em] text-white md:mt-4 md:text-[clamp(32px,3vw,42px)] md:leading-[1.1]">
              {title || DEFAULT_TITLE}
            </h2>
            <div className="mt-4 h-37.5 rounded-[14px] border-[1.5px] border-dashed border-white/25 bg-white/5 md:hidden" />
            <p className="mt-4.5 hidden max-w-110 text-base leading-[1.65] text-[#A9AC9F] md:block">
              {description || DEFAULT_DESCRIPTION}
            </p>
            <Link
              to={ROUTES.SHOP}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-[13.5px] font-bold text-ink transition-colors hover:bg-brand-bright md:mt-7 md:gap-2.5 md:px-7 md:py-3.75 md:text-[15px]"
            >
              Shop featured
              <ArrowRight className="size-3.5 md:size-4" />
            </Link>
          </div>
          <div className="hidden h-95 rounded-[20px] border-[1.5px] border-dashed border-white/25 bg-white/5 md:block" />
        </div>
      </Container>
    </section>
  );
}
