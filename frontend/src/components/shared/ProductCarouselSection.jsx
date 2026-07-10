import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/shared/ProductCard";
import { Container } from "@/components/shared/Container";

function CarouselSkeleton() {
  return (
    <div className="flex gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex w-[220px] shrink-0 flex-col gap-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ProductCarouselSection({ title, subtitle, products, isLoading }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", dragFree: true });
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
    <section className="py-16">
      <Container>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-2xl text-foreground sm:text-3xl">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="hidden gap-2 sm:flex">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous products"
              disabled={!canScrollPrev}
              onClick={() => emblaApi?.scrollPrev()}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next products"
              disabled={!canScrollNext}
              onClick={() => emblaApi?.scrollNext()}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <CarouselSkeleton />
        ) : (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} className="w-[220px] shrink-0 sm:w-[240px]" />
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
