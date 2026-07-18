import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Heart, ShoppingBag, CarFront } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { cloudinaryCard } from "@/lib/cloudinary";
import { useAddToCart } from "@/features/cart/api/useAddToCart";
import { RestockAlertDialog } from "@/components/shared/RestockAlertDialog";
import { useRestockAlertStore } from "@/stores/restockAlertStore";
import { useToggleWishlistMutation } from "../api/useWishlist";
import { isOnSale } from "@/lib/pricing";

function Badge({ children, tone }) {
  const cls = tone === "sale" ? "bg-brand text-ink" : "bg-ink text-white";
  return (
    <span className={cn("pointer-events-none rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] md:px-[11px] md:py-[5px] md:text-[10.5px] md:tracking-[0.07em]", cls)}>
      {children}
    </span>
  );
}

/** Wishlist product card — the design's variant: lime-filled heart (removes the
 * piece) and a full "Add to cart" / "Notify me" action button. */
export function WishlistCard({ product }) {
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlistMutation();
  const isAlerted = useRestockAlertStore((s) => s.isAlerted(product._id));
  const [notifyOpen, setNotifyOpen] = useState(false);

  const { slug, title, brand, price, salePrice, thumbnail, isNewArrival, isPreOrderActive, availableStock } = product;
  const onSale = isOnSale(product);
  const outOfStock = availableStock <= 0;
  const effectivePrice = onSale ? salePrice : price;

  const stop = (e) => e.stopPropagation();
  const onRemove = (e) => {
    e.stopPropagation();
    toggleWishlist.mutate({ productId: product._id, product, isWishlisted: true });
  };
  const onAdd = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };
  const onNotify = (e) => {
    e.stopPropagation();
    setNotifyOpen(true);
  };

  const Price = () => (
    <span className="flex items-baseline gap-1.5">
      <span className={cn("font-bold", onSale ? "text-[13px] font-semibold text-faint md:text-[14px]" : "text-[13.5px] text-ink md:text-[15.5px]")}>
        {formatTaka(effectivePrice)}
      </span>
      {onSale && <span className="text-[10.5px] text-[#A2A597] line-through md:text-[12px]">{formatTaka(price)}</span>}
    </span>
  );

  const Action = ({ block }) =>
    outOfStock ? (
      <button
        type="button"
        onClick={isAlerted ? stop : onNotify}
        className={cn(
          "flex items-center justify-center rounded-full border-[1.5px] border-ink text-[11.5px] font-bold transition-colors md:text-[12.5px]",
          block ? "h-9 w-full" : "px-4 py-[9px]",
          isAlerted ? "cursor-default border-brand text-brand-deep" : "text-ink hover:bg-ink hover:text-white"
        )}
      >
        {isAlerted ? "✓ Alert set" : "Notify me"}
      </button>
    ) : (
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add ${title} to cart`}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-full bg-ink text-[11.5px] font-bold text-white transition-colors hover:bg-[#5F7A10] md:text-[12.5px]",
          block ? "h-9 w-full" : "px-4 py-[9px]"
        )}
      >
        <ShoppingBag size={13} strokeWidth={1.9} /> Add to cart
      </button>
    );

  return (
    <>
      <div
        onClick={() => navigate(`/products/${slug}`)}
        className="group flex cursor-pointer flex-col overflow-hidden rounded-[18px] border border-line bg-white transition-[box-shadow,transform] duration-[180ms] md:rounded-[20px] md:hover:-translate-y-0.5 md:hover:shadow-[0_12px_32px_rgba(16,18,8,0.1)]"
      >
        <div className="relative flex h-[145px] items-center justify-center overflow-hidden bg-tile md:h-[230px]">
          {thumbnail?.url ? (
            <img src={cloudinaryCard(thumbnail.url)} alt={title} loading="lazy" decoding="async" className="h-full w-auto max-w-none" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <CarFront className="size-10 text-faint/50" strokeWidth={1.25} />
            </div>
          )}

          <div className="pointer-events-none absolute left-2.5 top-2.5 flex gap-1.5 md:left-3 md:top-3">
            {isPreOrderActive && <Badge tone="preorder">Pre-order</Badge>}
            {isNewArrival && <Badge tone="new">New</Badge>}
            {onSale && <Badge tone="sale">Sale</Badge>}
          </div>

          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove from wishlist"
            className="absolute right-2 top-2 flex size-[30px] items-center justify-center rounded-full bg-brand text-ink shadow-[0_1px_4px_rgba(16,18,8,0.12)] transition-colors hover:bg-brand-bright md:right-2.5 md:top-2.5 md:size-[34px]"
          >
            <Heart className="size-3.5 fill-ink md:size-[15px]" strokeWidth={1.5} />
          </button>

          {outOfStock && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[rgba(250,250,247,0.55)]">
              <span className="rounded-full border border-line bg-white px-2.5 py-[5px] text-[9px] font-bold uppercase tracking-[0.06em] text-ink-soft md:px-3.5 md:py-[7px] md:text-[11px] md:tracking-[0.07em]">
                Sold Out
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-3 pb-[13px] pt-[11px] md:px-4 md:pb-4 md:pt-[14px]">
          {brand?.name && (
            <div className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-faint md:text-[10.5px] md:tracking-[0.09em]">
              {brand.name}
            </div>
          )}
          <Link
            to={`/products/${slug}`}
            onClick={stop}
            className="mt-1 mb-2 block min-h-[33px] text-[12.5px] font-semibold leading-[1.3] text-ink hover:text-ink md:mt-[5px] md:mb-3 md:min-h-10 md:text-[14.5px] md:leading-[1.35]"
          >
            {title}
          </Link>

          {/* Desktop: price + action inline */}
          <div className="mt-auto hidden items-center justify-between gap-2.5 md:flex">
            <Price />
            <Action />
          </div>
          {/* Mobile: price, then full-width action */}
          <div className="mt-auto md:hidden">
            <Price />
            <div className="mt-2.5">
              <Action block />
            </div>
          </div>
        </div>
      </div>

      {outOfStock && <RestockAlertDialog product={product} open={notifyOpen} onOpenChange={setNotifyOpen} />}
    </>
  );
}
