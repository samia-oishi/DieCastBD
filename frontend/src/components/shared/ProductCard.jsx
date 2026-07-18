import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import { Plus, CarFront, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { cloudinaryCard } from "@/lib/cloudinary";
import { useAddToCart } from "@/features/cart/api/useAddToCart";
import { WishlistButton } from "@/features/wishlist/components/WishlistButton";
import { RestockAlertDialog } from "@/components/shared/RestockAlertDialog";
import { useRestockAlertStore } from "@/stores/restockAlertStore";
import { isOnSale } from "@/lib/pricing";

// Per-variant, per-breakpoint sizing read directly from the design markup.
const VARIANTS = {
  grid: {
    outer: "rounded-[18px] md:rounded-[20px]",
    img: "h-[205px] md:h-[300px]",
    pad: "px-3 pb-[13px] pt-[11px] md:px-4 md:pb-4 md:pt-[14px]",
    kicker: "text-[9.5px] tracking-[0.08em] md:text-[10.5px] md:tracking-[0.09em]",
    title: "mt-1 mb-2 text-[12.5px] min-h-[33px] md:mt-[5px] md:mb-3 md:text-[14.5px] md:min-h-10",
    price: "text-[13.5px] md:text-[15.5px]",
    addBtn: "size-[30px] md:size-8",
  },
  carousel: {
    outer: "rounded-[18px] md:rounded-[20px]",
    img: "h-[215px] md:h-[300px]",
    pad: "px-3.5 pb-3.5 pt-3 md:px-[18px] md:pb-[18px] md:pt-4",
    kicker: "text-[9.5px] tracking-[0.08em] md:text-[10.5px] md:tracking-[0.09em]",
    title: "mt-1 mb-2.5 text-[13px] min-h-[35px] md:mt-[5px] md:mb-3 md:text-[15px] md:min-h-[41px]",
    price: "text-[15px] md:text-base",
    addBtn: "size-9 md:size-8",
  },
};

function Badge({ children, tone }) {
  const cls = tone === "sale" ? "bg-brand text-ink" : "bg-ink text-white";
  return (
    <span className={cn("pointer-events-none rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] md:px-[11px] md:py-[5px] md:text-[10.5px] md:tracking-[0.07em]", cls)}>
      {children}
    </span>
  );
}

export function ProductCard({ product, variant = "grid", className }) {
  const v = VARIANTS[variant] ?? VARIANTS.grid;
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const isAlerted = useRestockAlertStore((s) => s.isAlerted(product._id));
  const [notifyOpen, setNotifyOpen] = useState(false);

  const { slug, title, brand, price, salePrice, thumbnail, gallery, isNewArrival, isPreOrderActive, availableStock } = product;
  const onSale = isOnSale(product);
  const outOfStock = availableStock <= 0;
  const effectivePrice = onSale ? salePrice : price;

  // The product's distinct images (thumbnail first), de-duped by Cloudinary id so
  // a product with only one real photo never counts as "multiple" and never
  // cycles — even if that photo is repeated as both thumbnail and a gallery entry.
  const images = useMemo(() => {
    const seen = new Set();
    return [thumbnail, ...(gallery ?? [])].filter((im) => {
      const key = im?.cloudinaryId ?? im?.url;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [thumbnail, gallery]);
  const hasMultiple = images.length > 1;

  // Desktop hover gallery: manual prev/next arrows (no auto-play — merchant
  // replaced the earlier 1s slideshow with explicit navigation). `hovering` is
  // only ever set for mouse pointers, so none of this engages on touch; the
  // arrows are additionally `hidden md:flex` as a second mobile guard.
  const [hovering, setHovering] = useState(false);
  const [index, setIndex] = useState(0);

  // Back to the thumbnail whenever the hover ends, so cards always rest on image 1.
  useEffect(() => {
    if (!hovering) setIndex(0);
  }, [hovering]);

  // Clamped, not wrap-around: the dimmed arrow at either end is what tells the
  // customer they've seen every photo. Disabled buttons also swallow the click,
  // so a tap on a dimmed arrow can't fall through to the card and open the PDP.
  const goPrev = (e) => {
    e.stopPropagation();
    setIndex((i) => Math.max(0, i - 1));
  };
  const goNext = (e) => {
    e.stopPropagation();
    setIndex((i) => Math.min(images.length - 1, i + 1));
  };

  // Shared shell for both nav arrows: round glass (frosted, like the site
  // header), desktop-only (`hidden md:flex`). Visibility is pure CSS — fade in
  // while the pointer is over the IMAGE area (`group/img`), not the whole card,
  // so the title/price zone stays clean and no JS state can leave them stuck
  // visible. The disabled end-arrow dims via colors (icon + fill), not
  // `disabled:opacity-*` — the group-hover opacity-100 would out-specify it.
  const arrowCls =
    "pointer-events-none absolute top-1/2 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/55 text-ink opacity-0 shadow-[0_2px_10px_rgba(16,18,8,0.16)] [backdrop-filter:blur(10px)_saturate(160%)] [-webkit-backdrop-filter:blur(10px)_saturate(160%)] transition-[opacity,background-color] duration-200 hover:bg-white/90 disabled:bg-white/40 disabled:text-ink/30 disabled:hover:bg-white/40 md:flex md:group-hover/img:pointer-events-auto md:group-hover/img:opacity-100";

  const stop = (e) => e.stopPropagation();
  const goToProduct = () => navigate(`/products/${slug}`);

  const quickAdd = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const openNotify = (e) => {
    e.stopPropagation();
    setNotifyOpen(true);
  };

  return (
    <>
      <div
        onClick={goToProduct}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") setHovering(true); }}
        onPointerLeave={() => setHovering(false)}
        className={cn(
          // Hover lift/shadow is desktop-only — on touch it sticks after a tap.
          "group flex h-full w-full cursor-pointer flex-col overflow-hidden border border-line bg-white transition-[box-shadow,transform] duration-[180ms] ease-out md:hover:-translate-y-0.5 md:hover:shadow-[0_12px_32px_rgba(16,18,8,0.1)]",
          v.outer,
          className
        )}
      >
        <div className={cn("group/img relative flex items-center justify-center overflow-hidden bg-white", v.img)}>
          {images.length > 0 ? (
            <>
              <img src={cloudinaryCard(images[0].url)} alt={title} loading="lazy" decoding="async" className="h-full w-auto max-w-none" />
              {/* Hover gallery: an arrow-driven horizontal track. The frames mount
                  (and thus load) only while hovering, so grids stay cheap. */}
              {hovering && hasMultiple && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div
                    className="flex h-full w-full transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${index * 100}%)` }}
                  >
                    {/* overflow-hidden per frame: these photos are wider than the
                        card (h-full + max-w-none center-crop), and without it each
                        slide's sides bleed into the neighbouring frame. */}
                    {images.map((im, i) => (
                      <div key={i} className="flex h-full w-full shrink-0 items-center justify-center overflow-hidden bg-white">
                        <img src={cloudinaryCard(im.url)} alt="" aria-hidden loading="lazy" decoding="async" className="h-full w-auto max-w-none" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Prev/next — round glass buttons, desktop-hover only. tabIndex -1:
                  these are a mouse affordance; keyboard/touch users get the full
                  gallery on the PDP itself. */}
              {hasMultiple && (
                <>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Previous image"
                    onClick={goPrev}
                    disabled={index === 0}
                    className={cn(arrowCls, "left-2")}
                  >
                    <ChevronLeft size={15} strokeWidth={2.2} />
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Next image"
                    onClick={goNext}
                    disabled={index === images.length - 1}
                    className={cn(arrowCls, "right-2")}
                  >
                    <ChevronRight size={15} strokeWidth={2.2} />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex size-full items-center justify-center bg-tile">
              <CarFront className="size-10 text-faint/50" strokeWidth={1.25} />
            </div>
          )}

          <div className="pointer-events-none absolute left-2.5 top-2.5 flex gap-1.5 md:left-3 md:top-3">
            {isPreOrderActive && <Badge tone="preorder">Pre-order</Badge>}
            {isNewArrival && <Badge tone="new">New</Badge>}
            {onSale && <Badge tone="sale">Sale</Badge>}
          </div>

          <WishlistButton
            product={product}
            className="absolute right-2.5 top-2.5 size-[34px] border-0 bg-white/[0.94] text-ink shadow-[0_1px_4px_rgba(16,18,8,0.12)] hover:bg-white"
          />

          {outOfStock && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[rgba(250,250,247,0.55)]">
              <span className="rounded-full border border-line bg-white px-2.5 py-[5px] text-[9px] font-bold uppercase tracking-[0.06em] text-ink-soft md:px-3.5 md:py-[7px] md:text-[11px] md:tracking-[0.07em]">
                Sold Out
              </span>
            </div>
          )}
        </div>

        <div className={cn("flex flex-1 flex-col", v.pad)}>
          {brand?.name && (
            <div className={cn("font-semibold uppercase text-faint", v.kicker)}>{brand.name}</div>
          )}
          <Link
            to={`/products/${slug}`}
            onClick={stop}
            className={cn("block font-semibold leading-[1.35] text-ink hover:text-ink", v.title)}
          >
            {title}
          </Link>

          <div className="mt-auto flex items-center justify-between">
            {outOfStock ? (
              <>
                <span className="text-[12px] font-semibold text-faint md:text-[13.5px]">{formatTaka(effectivePrice)}</span>
                <button
                  type="button"
                  onClick={isAlerted ? stop : openNotify}
                  className={cn(
                    "rounded-full border-[1.5px] border-ink px-2.5 py-1.5 text-[10.5px] font-bold transition-colors md:px-[13px] md:py-[7px] md:text-xs",
                    isAlerted ? "cursor-default text-brand-deep" : "text-ink hover:bg-ink hover:text-white"
                  )}
                >
                  {isAlerted ? "✓ Alert set" : "Notify me"}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5 md:gap-2">
                  <span className={cn("font-bold text-ink", v.price)}>{formatTaka(effectivePrice)}</span>
                  {onSale && <span className="text-[11px] text-faint line-through md:text-[13px]">{formatTaka(price)}</span>}
                </div>
                <button
                  type="button"
                  onClick={quickAdd}
                  aria-label={`Add ${title} to cart`}
                  className={cn("flex shrink-0 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-[#5F7A10]", v.addBtn)}
                >
                  <Plus size={13} strokeWidth={2.2} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {outOfStock && (
        <RestockAlertDialog product={product} open={notifyOpen} onOpenChange={setNotifyOpen} />
      )}
    </>
  );
}
