import { useState } from "react";
import { CarFront } from "lucide-react";

import { cn } from "@/lib/utils";
import { cloudinaryCard } from "@/lib/cloudinary";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/** Sticky gallery: main square image (click to zoom full-res) + thumbnail strip,
 * matching DiecastBD Product Details.dc.html. */
export function ProductGallery({ thumbnail, gallery, title, isNew }) {
  const images = [thumbnail, ...(gallery ?? [])].filter(Boolean);
  const [selected, setSelected] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-[20px] border border-line bg-white md:h-[520px] md:rounded-[24px]">
        <CarFront className="size-16 text-faint/30" strokeWidth={1} />
      </div>
    );
  }

  const active = images[Math.min(selected, images.length - 1)];

  return (
    <div className="md:sticky md:top-[98px]">
      <button
        type="button"
        onClick={() => setZoomOpen(true)}
        className="relative flex h-[300px] w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-[20px] border border-line bg-white md:h-[520px] md:rounded-[24px]"
      >
        <img src={cloudinaryCard(active.url)} alt={title} className="h-full w-auto max-w-none" />
        {isNew && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink px-2.5 py-[5px] text-[9.5px] font-bold uppercase tracking-[0.06em] text-white md:left-4 md:top-4 md:px-3 md:py-1.5 md:text-[10.5px] md:tracking-[0.07em]">
            New
          </span>
        )}
      </button>

      {images.length > 1 && (
        <div className="mt-2.5 flex gap-2.5 md:mt-3.5 md:gap-3">
          {images.map((image, i) => (
            <button
              key={image.cloudinaryId ?? i}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`View ${i + 1}`}
              className={cn(
                "relative flex h-[62px] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-tile transition-colors md:h-20 md:w-[88px] md:rounded-[14px]",
                i === selected ? "border-2 border-brand" : "border border-line"
              )}
            >
              <img src={cloudinaryCard(image.url)} alt="" className="h-full w-auto max-w-none" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none" showCloseButton={false}>
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <img src={active.url} alt={title} className="h-auto max-h-[85vh] w-full rounded-[16px] bg-white object-contain" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
