import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

function BannerImage({ image, className }) {
  return image?.url ? (
    <div className={cn("relative overflow-hidden rounded-[14px] md:rounded-[20px]", className)}>
      <img src={image.url} alt="" className="size-full object-cover" />
    </div>
  ) : (
    <div className={cn("relative rounded-[14px] border-[1.5px] border-dashed border-white/25 bg-white/5 md:rounded-[20px]", className)} />
  );
}

/** Dark "Premium Shelf" promo banner — title/description/image/colors/CTA are
 * all admin-editable (settings.collectorPromise); every field falls back to the
 * shipped design copy/colors/dashed placeholder when left blank. */
export function PremiumShelfBanner({ title, description, image, bgColor, textColor, ctaText, ctaLink }) {
  return (
    <section className="pt-6 md:pt-[76px]">
      <Container>
        <div
          className="rounded-[24px] bg-ink p-6 md:grid md:grid-cols-[repeat(auto-fit,minmax(400px,1fr))] md:items-center md:gap-14 md:rounded-[28px] md:p-16"
          style={bgColor ? { backgroundColor: bgColor } : undefined}
        >
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-brand md:text-xs md:tracking-[0.14em]">The Premium Shelf</div>
            <h2
              className="mt-2.5 font-display text-2xl font-extrabold leading-[1.12] tracking-[-0.015em] text-white md:mt-4 md:text-[clamp(32px,3vw,42px)] md:leading-[1.1]"
              style={textColor ? { color: textColor } : undefined}
            >
              {title || "Limited runs. Real metal. Gone fast."}
            </h2>
            <p
              className="mt-4 hidden max-w-[440px] text-base leading-[1.65] text-[#A9AC9F] md:block"
              style={textColor ? { color: textColor, opacity: 0.75 } : undefined}
            >
              {description || "Premium castings reach Bangladesh in one batch. When a piece sells through, it's retired — no reprints, no restocks."}
            </p>
            {/* Mobile: image sits between headline and CTA */}
            <BannerImage image={image} className="mt-4 h-[150px] md:hidden" />
            <Link to={ctaLink || `${ROUTES.SHOP}?featured=true`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-[13.5px] font-bold text-ink transition-colors hover:bg-brand-bright md:mt-7 md:gap-2.5 md:px-7 md:py-[15px] md:text-[15px]">
              {ctaText || "Shop featured"} <ArrowRight size={14} strokeWidth={2.2} className="md:size-4" />
            </Link>
          </div>
          <BannerImage image={image} className="hidden h-[380px] md:block" />
        </div>
      </Container>
    </section>
  );
}
