import { useEffect, useRef, useState } from "react";
import { CarFront, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { cloudinaryCard, cloudinaryZoom, cloudinaryFull } from "@/lib/cloudinary";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const ZOOM = 2.5;

/** True only for devices that genuinely hover with a precise pointer.
 *
 * The pointerType guard alone isn't enough: a hybrid laptop or a phone in
 * desktop-mode can still report a mouse, and the magnifier is useless on a
 * touch screen where there is no cursor to follow. Read once at mount —
 * matchMedia is missing in jsdom, hence the optional call. */
function useHasHover() {
  const [hasHover, setHasHover] = useState(false);
  useEffect(() => {
    setHasHover(window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false);
  }, []);
  return hasHover;
}

/** Preloads a URL and reports when it's actually decodable.
 *
 * The magnifier used to point at a 1600px image that only started downloading
 * on hover, so the first hover showed a blank white panel for as long as the
 * fetch took — read as "zoom is slow". Now the zoom source is fetched as soon
 * as the main image is chosen, and the overlay only appears once it's ready. */
function usePreloadedImage(url) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!url) return undefined;
    setReady(false);
    const img = new Image();
    let cancelled = false;
    img.onload = () => !cancelled && setReady(true);
    img.src = url;
    // A cached image can be complete before onload is wired up.
    if (img.complete) setReady(true);
    return () => {
      cancelled = true;
    };
  }, [url]);
  return ready;
}

function MainImage({ image, title, isNew, onOpen }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const rectRef = useRef(null); // displayed image's viewport rect (for cursor math)
  const [box, setBox] = useState(null); // same rect, relative to the container (for overlay position)
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hovering, setHovering] = useState(false);

  const hasHover = useHasHover();
  const zoomSrc = cloudinaryZoom(image.url);
  const zoomReady = usePreloadedImage(hasHover ? zoomSrc : null);

  const onEnter = (e) => {
    if (!hasHover || e.pointerType !== "mouse") return;
    const c = containerRef.current?.getBoundingClientRect();
    const r = imgRef.current?.getBoundingClientRect();
    if (!c || !r) return;
    rectRef.current = r;
    setBox({ left: r.left - c.left, top: r.top - c.top, width: r.width, height: r.height });
    setHovering(true);
  };

  const onMove = (e) => {
    const r = rectRef.current;
    if (!hasHover || e.pointerType !== "mouse" || !r) return;
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
      aria-label={`View ${title} full screen`}
      className={cn(
        "relative flex h-[300px] w-full items-center justify-center overflow-hidden rounded-[20px] border border-line bg-white md:h-[520px] md:rounded-[24px]",
        hasHover && "cursor-zoom-in"
      )}
    >
      <img ref={imgRef} src={cloudinaryCard(image.url)} alt={title} decoding="async" className="h-full w-auto max-w-none" />

      {hovering && zoomReady && box && (
        <div
          aria-hidden
          className="pointer-events-none absolute bg-white bg-no-repeat"
          style={{
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            backgroundImage: `url(${zoomSrc})`,
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

/** Full-screen viewer. Fits the image to the screen by default and toggles to
 * 100% actual pixels, which is what "see it at full size" means — the old
 * dialog capped at 768px wide and could never show the real thing. */
function Lightbox({ images, index, onIndex, title, open, onClose }) {
  const [actualSize, setActualSize] = useState(false);
  const image = images[index];

  // Reset the zoom whenever the viewer opens or the slide changes, so it never
  // opens mysteriously scrolled into the middle of a previous image.
  useEffect(() => setActualSize(false), [index, open]);

  useEffect(() => {
    if (!open || images.length < 2) return undefined;
    const onKey = (e) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, images.length, onIndex]);

  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        style={{ width: "100vw", maxWidth: "none" }}
        className="h-[100dvh] gap-0 border-none bg-[rgba(16,18,8,0.96)] p-0 shadow-none sm:rounded-none"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Controls sit above the image and are 44px targets for thumbs. */}
        <div className="absolute right-3 top-3 z-20 flex gap-2">
          <button
            type="button"
            onClick={() => setActualSize((v) => !v)}
            aria-label={actualSize ? "Fit to screen" : "View actual size"}
            className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            {actualSize ? <ZoomOut size={18} strokeWidth={1.9} /> : <ZoomIn size={18} strokeWidth={1.9} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* In actual-size mode the wrapper scrolls in both axes so the image can
            be panned; fit mode centres it with no scrollbars. */}
        <div className={cn("flex h-full w-full", actualSize ? "overflow-auto" : "items-center justify-center overflow-hidden p-4 pt-16")}>
          <img
            src={cloudinaryFull(image.url)}
            alt={title}
            decoding="async"
            onClick={() => setActualSize((v) => !v)}
            className={cn(
              actualSize
                ? "m-auto max-w-none cursor-zoom-out"
                : "max-h-full max-w-full cursor-zoom-in object-contain"
            )}
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => onIndex((index - 1 + images.length) % images.length)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => onIndex((index + 1) % images.length)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>
            <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur">
              {index + 1} / {images.length}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Sticky gallery: main image (hover to magnify on desktop, tap/click for the
 * full-screen viewer) + thumbnail strip, matching DiecastBD Product Details.dc.html. */
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

  const index = Math.min(selected, images.length - 1);

  return (
    <div className="md:sticky md:top-[98px]">
      <MainImage image={images[index]} title={title} isNew={isNew} onOpen={() => setZoomOpen(true)} />

      {images.length > 1 && (
        <div className="mt-2.5 flex gap-2.5 overflow-x-auto md:mt-3.5 md:gap-3">
          {images.map((image, i) => (
            <button
              key={image.cloudinaryId ?? i}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "relative flex h-[62px] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-tile transition-colors md:h-20 md:w-[88px] md:rounded-[14px]",
                i === index ? "border-2 border-brand" : "border border-line"
              )}
            >
              <img src={cloudinaryCard(image.url)} alt="" loading="lazy" decoding="async" className="h-full w-auto max-w-none" />
            </button>
          ))}
        </div>
      )}

      <Lightbox
        images={images}
        index={index}
        onIndex={setSelected}
        title={title}
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
      />
    </div>
  );
}
