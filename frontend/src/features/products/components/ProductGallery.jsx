import { useRef, useState } from "react";
import { CarFront } from "lucide-react";

import { cn } from "@/lib/utils";
import { cloudinaryCard, cloudinaryZoom } from "@/lib/cloudinary";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const ZOOM = 2.5;

/** Main image with a desktop hover magnifier: while a mouse hovers, an overlay
 * sized exactly to the displayed image shows a higher-res copy at {ZOOM}x, panned
 * to follow the cursor. Touch has no hover (guarded via pointerType), so a tap
 * just opens the full-screen dialog via onOpen — same as before. */
function MainImage({ image, title, isNew, onOpen }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const rectRef = useRef(null); // displayed image's viewport rect (for cursor math)
  const [box, setBox] = useState(null); // same rect, relative to the container (for overlay position)
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hovering, setHovering] = useState(false);

  const onEnter = (e) => {
    if (e.pointerType !== "mouse") return;
    const c = containerRef.current?.getBoundingClientRect();
    const r = imgRef.current?.getBoundingClientRect();
    if (!c || !r) return;
    rectRef.current = r;
    setBox({ left: r.left - c.left, top: r.top - c.top, width: r.width, height: r.height });
    setHovering(true);
  };
  const onMove = (e) => {
    const r = rectRef.current;
    if (e.pointerType !== "mouse" || !r) return;
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    setPos({ x, y });
  };

  return (
    <button
      ref={containerRef}
      type="button"
      onClick={onOpen}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={() => setHovering(false)}
      className="relative flex h-[300px] w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-[20px] border border-line bg-white md:h-[520px] md:rounded-[24px]"
    >
      <img ref={imgRef} src={cloudinaryCard(image.url)} alt={title} loading="lazy" decoding="async" className="h-full w-auto max-w-none" />
      {hovering && box && (
        <div
          aria-hidden
          className="pointer-events-none absolute bg-white bg-no-repeat"
          style={{
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            backgroundImage: `url(${cloudinaryZoom(image.url)})`,
            backgroundSize: `${ZOOM * 100}%`,
            backgroundPosition: `${pos.x}% ${pos.y}%`,
          }}
        />
      )}
      {isNew && (
        <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-ink px-2.5 py-[5px] text-[9.5px] font-bold uppercase tracking-[0.06em] text-white md:left-4 md:top-4 md:px-3 md:py-1.5 md:text-[10.5px] md:tracking-[0.07em]">
          New
        </span>
      )}
    </button>
  );
}

/** Sticky gallery: main image (hover to magnify on desktop, tap/click for the
 * full-res dialog) + thumbnail strip, matching DiecastBD Product Details.dc.html. */
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
      <MainImage image={active} title={title} isNew={isNew} onOpen={() => setZoomOpen(true)} />

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
              <img src={cloudinaryCard(image.url)} alt="" loading="lazy" decoding="async" className="h-full w-auto max-w-none" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none" showCloseButton={false}>
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <img src={cloudinaryZoom(active.url)} alt={title} loading="lazy" decoding="async" className="h-auto max-h-[85vh] w-full rounded-[16px] bg-white object-contain" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
