import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { CarFront, ZoomIn } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function ProductGallery({ thumbnail, gallery, title }) {
  const images = [thumbnail, ...(gallery ?? [])].filter(Boolean);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const onSelect = useCallback((api) => setSelectedIndex(api.selectedScrollSnap()), []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-card">
        <CarFront className="size-16 text-muted-foreground/30" strokeWidth={1} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative aspect-square overflow-hidden rounded-xl bg-card">
        <div className="h-full overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {images.map((image, index) => (
              <button
                key={image.cloudinaryId ?? index}
                type="button"
                onClick={() => setZoomOpen(true)}
                className="relative h-full min-w-0 shrink-0 grow-0 basis-full cursor-zoom-in"
              >
                <img src={image.url} alt={`${title} — view ${index + 1}`} className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIn className="size-4" />
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((image, index) => (
            <button
              key={image.cloudinaryId ?? index}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                index === selectedIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img src={image.url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <img
            src={images[selectedIndex].url}
            alt={title}
            className="h-auto max-h-[85vh] w-full rounded-lg object-contain"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
