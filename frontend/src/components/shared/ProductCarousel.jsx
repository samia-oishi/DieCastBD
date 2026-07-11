import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProductCard } from "@/components/shared/ProductCard";
import { cn } from "@/lib/utils";

function SkeletonSlide() {
  return <div className="h-[240px] w-52.5 shrink-0 animate-pulse rounded-[20px] bg-line-soft md:w-[316px]" />;
}

/** Horizontal native-scroll carousel matching the design (snap, hidden
 * scrollbar, next-card peek on mobile). Slides are 210px mobile / 316px desktop;
 * generous vertical padding keeps card hover shadows from clipping. */
export function ProductCarousel({ title, subtitle, products, isLoading, viewAllHref, viewAllLabel, className }) {
  return (
    <section className={className}>
      <SectionHeader title={title} subtitle={subtitle} viewAllHref={viewAllHref} viewAllLabel={viewAllLabel} />
      <div
        data-carousel
        className={cn(
          "-mx-4 mt-3.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 pt-3 md:-mx-3 md:gap-5 md:px-3",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonSlide key={i} />)
          : products?.map((product) => (
              <div key={product._id} className="w-52.5 shrink-0 snap-start md:w-[316px]">
                <ProductCard product={product} variant="carousel" />
              </div>
            ))}
      </div>
    </section>
  );
}
