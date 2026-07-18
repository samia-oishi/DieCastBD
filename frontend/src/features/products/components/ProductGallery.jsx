import { useEffect, useRef, useState } from "react";
import { CarFront, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { cloudinaryCard, cloudinaryZoom, cloudinaryFull } from "@/lib/cloudinary";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const ZOOM = 2.5;

/** Dark pills for the prev/next arrows, which do overlay the photo. */
const VIEWER_BTN =
  "flex size-10 items-center justify-center rounded-full bg-[rgba(16,18,8,0.55)] text-white backdrop-blur transition-colors hover:bg-[rgba(16,18,8,0.75)]";

/** Light circles for the header bar — they sit on white, not on the image. */
const HEADER_BTN =
  "flex size-9 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:bg-tile";

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
      // The magnifier is desktop-only. Handlers simply aren't attached on
      // non-hover devices — there is nothing for a stray synthetic mouse
      // event to trigger.
      onPointerEnter={hasHover ? onEnter : undefined}
      onPointerMove={hasHover ? onMove : undefined}
      onPointerLeave={hasHover ? () => setHovering(false) : undefined}
      aria-label={`View ${title} full screen`}
      className={cn(
        "relative flex h-[300px] w-full items-center justify-center overflow-hidden rounded-[20px] border border-line bg-white md:h-[520px] md:rounded-[24px]",
        hasHover && "cursor-zoom-in"
      )}
    >
      <img ref={imgRef} src={cloudinaryCard(image.url)} alt={title} decoding="async" className="h-full w-auto max-w-none" />

      {/* Belt and braces on top of the JS gates: the media query hides the
          overlay at the CSS level on any device that can't hover, so even an
          unforeseen synthetic mouse event can't leave a zoomed image stuck on
          screen — which is exactly what happened on a real iPhone. */}
      {hasHover && hovering && zoomReady && box && (
        <div
          aria-hidden
          className="pointer-events-none absolute bg-white bg-no-repeat [@media(hover:none)]:hidden"
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

/** Image viewer as a standard centred dialog: the page stays visible behind the
 * scrim, tapping outside the image closes it (Radix default once the content
 * no longer covers the screen). The controls live in a header BAR above the
 * photo, not floating on it — the merchant's explicit ask — which also means
 * they can't cover the product. One tap on the image toggles actual 1:1 pixels
 * inside a pannable scroll area that starts centred. */
function Lightbox({ images, index, onIndex, title, open, onClose }) {
  const [actualSize, setActualSize] = useState(false);
  const panRef = useRef(null);
  const image = images[index];

  // Reset the zoom whenever the viewer opens or the slide changes, so it never
  // opens mysteriously scrolled into the middle of a previous image.
  useEffect(() => setActualSize(false), [index, open]);

  // 1:1 mode used to open scrolled to the image's top-left corner — on a
  // product shot that corner is blank white, which read as "zoom is broken".
  // Centre the pan area on the middle of the photo instead.
  const centerPan = () => {
    const el = panRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
  };
  useEffect(() => {
    if (actualSize) centerPan();
  }, [actualSize]);

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

  const src = cloudinaryFull(image.url);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {/* Width overridden at BOTH breakpoints — shadcn caps base and sm:, and
          tailwind-merge only dedupes within a variant (the AdminModal lesson). */}
      <DialogContent
        showCloseButton={false}
        className="w-auto max-w-none gap-0 overflow-hidden rounded-[18px] border-none bg-white p-0 shadow-[0_24px_70px_rgba(16,18,8,0.45)] sm:max-w-none"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Header bar — controls sit above the photo, never on it. */}
        <div className="flex items-center justify-between gap-3 border-b border-line-soft px-3.5 py-2">
          <span className="text-[12.5px] font-semibold text-ink-soft">
            {images.length > 1 ? `${index + 1} / ${images.length}` : "Photo"}
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setActualSize((v) => !v)}
              aria-label={actualSize ? "Fit to screen" : "View actual size"}
              className={HEADER_BTN}
            >
              {actualSize ? <ZoomOut size={17} strokeWidth={1.9} /> : <ZoomIn size={17} strokeWidth={1.9} />}
            </button>
            <button type="button" onClick={onClose} aria-label="Close" className={HEADER_BTN}>
              <X size={17} strokeWidth={2} />
            </button>
          </div>
        </div>

        {actualSize ? (
          // 1:1 pixels; the wrapper pans in both axes when the image outgrows
          // it. Width is pinned to the fit-mode footprint so toggling zoom
          // doesn't reshape the dialog into a tall strip.
          <div
            ref={panRef}
            className="max-h-[70vh] w-[calc(100vw-24px)] overflow-auto overscroll-contain sm:w-auto sm:max-w-[min(92vw,1100px)] sm:max-h-[78vh]"
          >
            <img src={src} alt={title} decoding="async" onLoad={centerPan} onClick={() => setActualSize(false)} className="max-w-none cursor-zoom-out" />
          </div>
        ) : (
          <img
            src={src}
            alt={title}
            decoding="async"
            onClick={() => setActualSize(true)}
            className="block h-auto max-h-[74vh] w-auto max-w-[calc(100vw-24px)] cursor-zoom-in sm:max-w-[min(92vw,1100px)]"
          />
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => onIndex((index - 1 + images.length) % images.length)}
              aria-label="Previous image"
              className={cn(VIEWER_BTN, "absolute left-2 top-1/2 z-20 -translate-y-1/2")}
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => onIndex((index + 1) % images.length)}
              aria-label="Next image"
              className={cn(VIEWER_BTN, "absolute right-2 top-1/2 z-20 -translate-y-1/2")}
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Sticky gallery: main image (hover to magnify on desktop, tap/click for the
 * dialog viewer) + thumbnail strip, matching DiecastBD Product Details.dc.html.
 * `actions` renders floating over the image's top-right corner — the mobile PDP
 * puts wishlist/share there, matching the storefront product cards. */
export function ProductGallery({ thumbnail, gallery, title, isNew, actions }) {
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
      <div className="relative">
        <MainImage image={images[index]} title={title} isNew={isNew} onOpen={() => setZoomOpen(true)} />
        {/* Siblings of the image button, not children — taps here must never
            fall through and open the viewer. */}
        {actions && <div className="absolute right-3 top-3 z-10 flex gap-2">{actions}</div>}
      </div>

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
