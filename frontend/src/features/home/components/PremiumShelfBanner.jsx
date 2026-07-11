import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { ROUTES } from "@/constants/routes";

/** Dark "Premium Shelf" promo banner. Copy is the design's; the image slot has
 * no backing field (CollectorPromise has title/description only), so it renders
 * the design's own dashed placeholder rather than a fabricated photo. */
export function PremiumShelfBanner({ title, description }) {
  return (
    <section className="pt-6 md:pt-[76px]">
      <Container>
        <div className="rounded-[24px] bg-ink p-6 md:grid md:grid-cols-[repeat(auto-fit,minmax(400px,1fr))] md:items-center md:gap-14 md:rounded-[28px] md:p-16">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-brand md:text-xs md:tracking-[0.14em]">The Premium Shelf</div>
            <h2 className="mt-2.5 font-display text-2xl font-extrabold leading-[1.12] tracking-[-0.015em] text-white md:mt-4 md:text-[clamp(32px,3vw,42px)] md:leading-[1.1]">
              {title || "Limited runs. Real metal. Gone fast."}
            </h2>
            <p className="mt-4 hidden max-w-[440px] text-base leading-[1.65] text-[#A9AC9F] md:block">
              {description || "Premium castings reach Bangladesh in one batch. When a piece sells through, it's retired — no reprints, no restocks."}
            </p>
            {/* Mobile: image placeholder sits between headline and CTA */}
            <div className="relative mt-4 h-[150px] rounded-[14px] border-[1.5px] border-dashed border-white/25 bg-white/5 md:hidden" />
            <Link to={`${ROUTES.SHOP}?featured=true`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-[13.5px] font-bold text-ink transition-colors hover:bg-brand-bright md:mt-7 md:gap-2.5 md:px-7 md:py-[15px] md:text-[15px]">
              Shop featured <ArrowRight size={14} strokeWidth={2.2} className="md:size-4" />
            </Link>
          </div>
          <div className="relative hidden h-[380px] rounded-[20px] border-[1.5px] border-dashed border-white/25 bg-white/5 md:block" />
        </div>
      </Container>
    </section>
  );
}
