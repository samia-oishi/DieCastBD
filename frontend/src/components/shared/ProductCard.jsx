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

const VARIANTS = {
  grid: {
    img: "h-[150px] md:h-[220px]",
    pad: "p-[14px] md:pb-4",
    title: "text-[14.5px] min-h-10",
    price: "text-[15.5px]",
  },
  carousel: {
    img: "h-[150px] md:h-[240px]",
    pad: "p-4 md:p-[18px] md:pt-4",
    title: "text-[15px] min-h-[41px]",
    price: "text-base",
  },
};

function Badge({ children, tone }) {
  const cls = tone === "sale" ? "bg-brand text-ink" : "bg-ink text-white";
  return (
    <span className={cn("pointer-events-none rounded-full px-[11px] py-[5px] text-[10.5px] font-bold uppercase tracking-[0.07em]", cls)}>
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
          "group flex w-full cursor-pointer flex-col overflow-hidden rounded-[20px] border border-line bg-white transition-[box-shadow,transform] duration-[180ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(16,18,8,0.1)]",
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

          <div className="pointer-events-none absolute left-3 top-3 flex gap-1.5">
            {isNewArrival && <Badge tone="new">New</Badge>}
            {onSale && <Badge tone="sale">Sale</Badge>}
          </div>

          <WishlistButton
            product={product}
            className="absolute right-2.5 top-2.5 size-[34px] border-0 bg-white/[0.94] text-ink shadow-[0_1px_4px_rgba(16,18,8,0.12)] hover:bg-white"
          />

          {outOfStock && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[rgba(250,250,247,0.55)]">
              <span className="rounded-full border border-line bg-white px-3.5 py-[7px] text-[11px] font-bold uppercase tracking-[0.07em] text-ink-soft">
                Sold Out
              </span>
            </div>
          )}
        </div>

        <div className={cn("flex flex-1 flex-col", v.pad)}>
          {brand?.name && (
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-faint">{brand.name}</div>
          )}
          <Link
            to={`/products/${slug}`}
            onClick={stop}
            className={cn("mb-3 mt-[5px] block font-semibold leading-[1.35] text-ink hover:text-ink", v.title)}
          >
            {title}
          </Link>

          <div className="mt-auto flex items-center justify-between">
            {outOfStock ? (
              <>
                <span className="text-[13.5px] font-semibold text-faint">{formatTaka(effectivePrice)}</span>
                <button
                  type="button"
                  onClick={isAlerted ? stop : openNotify}
                  className={cn(
                    "rounded-full border-[1.5px] border-ink px-[13px] py-[7px] text-xs font-bold transition-colors",
                    isAlerted ? "cursor-default text-brand-deep" : "text-ink hover:bg-ink hover:text-white"
                  )}
                >
                  {isAlerted ? "✓ Alert set" : "Notify me"}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className={cn("font-bold text-ink", v.price)}>{formatTaka(effectivePrice)}</span>
                  {onSale && <span className="text-[13px] text-faint line-through">{formatTaka(price)}</span>}
                </div>
                <button
                  type="button"
                  onClick={quickAdd}
                  aria-label={`Add ${title} to cart`}
                  className="flex size-8 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-[#5F7A10]"
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
