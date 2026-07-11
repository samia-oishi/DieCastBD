import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Plus, CarFront } from "lucide-react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { cloudinaryCard } from "@/lib/cloudinary";
import { useCart } from "@/features/cart/api/useCart";
import { WishlistButton } from "@/features/wishlist/components/WishlistButton";
import { RestockAlertDialog } from "@/components/shared/RestockAlertDialog";
import { useRestockAlertStore } from "@/stores/restockAlertStore";

// Per-variant, per-breakpoint sizing read directly from the design markup.
const VARIANTS = {
  grid: {
    outer: "rounded-[20px]",
    img: "h-[150px] md:h-[220px]",
    pad: "p-[14px]",
    kicker: "text-[10.5px] tracking-[0.09em]",
    title: "mt-[5px] mb-3 text-[14.5px] min-h-10",
    price: "text-[15.5px]",
    addBtn: "size-8",
  },
  carousel: {
    outer: "rounded-[18px] md:rounded-[20px]",
    img: "h-[172px] md:h-[240px]",
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
  const { addItem } = useCart();
  const isAlerted = useRestockAlertStore((s) => s.isAlerted(product._id));
  const [notifyOpen, setNotifyOpen] = useState(false);

  const { slug, title, brand, price, salePrice, thumbnail, isNewArrival, availableStock } = product;
  const onSale = salePrice != null && salePrice < price;
  const outOfStock = availableStock <= 0;
  const effectivePrice = onSale ? salePrice : price;

  const stop = (e) => e.stopPropagation();
  const goToProduct = () => navigate(`/products/${slug}`);

  const quickAdd = (e) => {
    e.stopPropagation();
    addItem(product, 1);
    toast.success("Added to cart");
  };

  const openNotify = (e) => {
    e.stopPropagation();
    setNotifyOpen(true);
  };

  return (
    <>
      <div
        onClick={goToProduct}
        className={cn(
          // Hover lift/shadow is desktop-only — on touch it sticks after a tap.
          "group flex h-full w-full cursor-pointer flex-col overflow-hidden border border-line bg-white transition-[box-shadow,transform] duration-[180ms] ease-out md:hover:-translate-y-0.5 md:hover:shadow-[0_12px_32px_rgba(16,18,8,0.1)]",
          v.outer,
          className
        )}
      >
        <div className={cn("relative bg-white", v.img)}>
          {thumbnail?.url ? (
            <img src={cloudinaryCard(thumbnail.url)} alt={title} className="size-full object-contain p-[5%]" />
          ) : (
            <div className="flex size-full items-center justify-center bg-tile">
              <CarFront className="size-10 text-faint/50" strokeWidth={1.25} />
            </div>
          )}

          <div className="pointer-events-none absolute left-2.5 top-2.5 flex gap-1.5 md:left-3 md:top-3">
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
