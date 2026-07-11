import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/shared/ProductCard";
import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";

function CarouselSkeleton() {
  return (
    <div className="flex gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex w-52.5 shrink-0 flex-col gap-3 md:w-79">
          <Skeleton className="aspect-square w-full rounded-[20px]" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Embla-backed product row — Home's Collector Picks/Featured/New Arrivals,
 * PDP's Related/Recently-viewed. Slides are 210px on mobile (the next card
 * partially visible, matching README §Key Components) and 316px on desktop.
 * The reference's arrow buttons jump ~80% of the viewport width via a
 * hand-rolled native `scrollBy` (its cards sit in a plain `overflow-x:auto`
 * div, not a real carousel library) — Embla renders via CSS transforms, not
 * native scroll, so there's no DOM element a native `scrollBy` would move.
 * `scrollPrev`/`scrollNext` (Embla's actual API for this) is the correct
 * equivalent: it advances by one full slide group, which is the closest
 * `slidesToScroll` can honestly get to "most of a screen" here. */
export function ProductCarouselSection({
  title,
  subtitle,
  products,
  isLoading,
  seeAllHref,
  seeAllLabel = "See All",
  topClassName = "pt-5 md:pt-19",
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback((api) => {
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <section className={topClassName}>
      <Container>
        <SectionHeader
          title={title}
          subtitle={subtitle}
          seeAllHref={seeAllHref}
          seeAllLabel={seeAllLabel}
          onPrev={() => emblaApi?.scrollPrev()}
          onNext={() => emblaApi?.scrollNext()}
          canPrev={canScrollPrev}
          canNext={canScrollNext}
        />

        {isLoading ? (
          <div className="mt-6">
            <CarouselSkeleton />
          </div>
        ) : (
          <div className="mt-3.5 -m-3 overflow-hidden py-3" ref={emblaRef}>
            <div className="flex gap-5 px-3">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} className="w-52.5 shrink-0 md:w-79" />
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
