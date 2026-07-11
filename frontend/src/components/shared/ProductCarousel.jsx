import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProductCard } from "@/components/shared/ProductCard";
import { useDragScroll } from "@/hooks/useDragScroll";

function SkeletonSlide() {
  return <div className="h-[172px] w-52.5 shrink-0 animate-pulse rounded-[18px] bg-line-soft md:h-[240px] md:w-[316px] md:rounded-[20px]" />;
}

/** Horizontal carousel matching the design (snap, hidden scrollbar, next-card
 * peek on mobile, click-and-drag). Slides 210px mobile / 316px desktop. The
 * scroll row cancels the Container's mobile gutter (-mx-4) to run edge-to-edge
 * with its own 16px padding, then re-aligns to the Container on desktop. */
export function ProductCarousel({ title, subtitle, products, isLoading, viewAllHref, viewAllLabel, className }) {
  const { ref, dragProps } = useDragScroll();
  return (
    <section className={className}>
      <Container>
        <SectionHeader title={title} subtitle={subtitle} viewAllHref={viewAllHref} viewAllLabel={viewAllLabel} />
        <div
          ref={ref}
          {...dragProps}
          data-carousel
          className="-mx-4 mt-3 flex snap-x snap-proximity gap-3 scroll-pl-4 overflow-x-auto px-4 pb-1 pt-3 [scrollbar-width:none] md:-mx-3 md:-mb-[26px] md:mt-3.5 md:gap-5 md:scroll-pl-0 md:px-3 md:pb-10 [&::-webkit-scrollbar]:hidden"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonSlide key={i} />)
            : products?.map((product) => (
                <div key={product._id} className="w-52.5 shrink-0 snap-start md:w-[316px]">
                  <ProductCard product={product} variant="carousel" />
                </div>
              ))}
        </div>
      </Container>
    </section>
  );
}
