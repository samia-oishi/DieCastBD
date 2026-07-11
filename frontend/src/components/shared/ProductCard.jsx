import { useState } from "react";
import { Link } from "react-router";
import { CarFront, Plus } from "lucide-react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { productThumbUrl } from "@/lib/cloudinary";
import { useCart } from "@/features/cart/api/useCart";
import { WishlistButton } from "@/features/wishlist/components/WishlistButton";
import { RestockAlertModal } from "@/features/products/components/RestockAlertModal";

function QuickAddButton({ product }) {
  const { addItem } = useCart();

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    toast.success("Added to cart");
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add to cart"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-[#5F7A10]"
    >
      <Plus className="size-3.5" strokeWidth={2.4} />
    </button>
  );
}

function NotifyMeButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full border-[1.5px] border-ink px-3.5 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-ink hover:text-white"
    >
      Notify me
    </button>
  );
}

/** Product card used across Home carousels, Shop grid, Wishlist, and PDP's
 * related/recently-viewed rows. The whole card navigates to the PDP; every
 * inner interactive element stops propagation so a wishlist toggle/quick-add/
 * notify-me click never also triggers navigation (README §Key Components). */
export function ProductCard({ product, className }) {
  const [notifyOpen, setNotifyOpen] = useState(false);
  const { slug, title, brand, price, salePrice, thumbnail, isNewArrival, availableStock } = product;
  const onSale = salePrice != null && salePrice < price;
  const outOfStock = availableStock <= 0;

  const openNotify = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setNotifyOpen(true);
  };

  return (
    <>
      <Link
        to={`/products/${slug}`}
        className={cn(
          "group block overflow-hidden rounded-[20px] border border-border bg-card transition-[transform,box-shadow] duration-[180ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(16,18,8,.10)]",
          className
        )}
      >
        <div className="relative aspect-square bg-white p-[5%]">
          {thumbnail?.url ? (
            <img src={productThumbUrl(thumbnail.url)} alt={title} className="size-full object-contain" />
          ) : (
            <div className="flex size-full items-center justify-center bg-[#F1F2EA]">
              <CarFront className="size-10 text-muted-foreground/40" strokeWidth={1.25} />
            </div>
          )}

          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {isNewArrival && (
              <span className="rounded-full bg-ink px-2.75 py-1 text-[10.5px] font-bold tracking-wide text-white uppercase">New</span>
            )}
            {onSale && (
              <span className="rounded-full bg-brand px-2.75 py-1 text-[10.5px] font-bold tracking-wide text-ink uppercase">Sale</span>
            )}
          </div>

          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-paper/55">
              <span className="rounded-full border border-border bg-white px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-ink-soft uppercase">
                Sold Out
              </span>
            </div>
          )}

          <WishlistButton product={product} className="absolute top-2.5 right-2.5" />
        </div>

        <div className="p-4 pb-4.5">
          {brand?.name && <div className="text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">{brand.name}</div>}
          <div className="mt-1.25 line-clamp-2 min-h-10 text-[14.5px] leading-[1.35] font-semibold text-foreground">{title}</div>

          {outOfStock ? (
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[13.5px] font-semibold text-muted-foreground">{formatPrice(price)}</span>
              <NotifyMeButton onClick={openNotify} />
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-baseline gap-1.5">
                <span className="text-[15.5px] font-bold text-foreground">{formatPrice(onSale ? salePrice : price)}</span>
                {onSale && <span className="text-xs font-medium text-muted-foreground line-through">{formatPrice(price)}</span>}
              </span>
              <QuickAddButton product={product} />
            </div>
          )}
        </div>
      </Link>

      {outOfStock && <RestockAlertModal product={product} open={notifyOpen} onOpenChange={setNotifyOpen} />}
    </>
  );
}
