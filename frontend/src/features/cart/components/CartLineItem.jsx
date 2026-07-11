import { Link } from "react-router";
import { Minus, Plus, X, CarFront, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { cloudinaryCard } from "@/lib/cloudinary";
import { useCart } from "../api/useCart";

function Thumb({ product, className }) {
  return (
    <Link to={`/products/${product.slug}`} className={cn("relative shrink-0 overflow-hidden rounded-xl bg-tile md:rounded-[14px]", className)}>
      {product.thumbnail?.url ? (
        <img src={cloudinaryCard(product.thumbnail.url)} alt={product.title} className="size-full object-contain p-[6%]" />
      ) : (
        <div className="flex size-full items-center justify-center"><CarFront className="size-6 text-faint/40" strokeWidth={1.25} /></div>
      )}
    </Link>
  );
}

function QtyPill({ qty, max, onChange, size = "md" }) {
  const dims = size === "sm" ? "h-[34px]" : "h-10";
  const btn = size === "sm" ? "h-[34px] w-8" : "h-10 w-[38px]";
  const icon = size === "sm" ? 12 : 13;
  return (
    <div className={cn("flex items-center rounded-full border border-line bg-paper", dims)}>
      <button type="button" onClick={() => onChange(qty - 1)} disabled={qty <= 1} aria-label="Decrease quantity" className={cn("flex items-center justify-center text-ink disabled:opacity-30", btn)}>
        <Minus size={icon} strokeWidth={2.3} />
      </button>
      <span className={cn("min-w-[18px] text-center font-bold text-ink tabular-nums", size === "sm" ? "text-[13px]" : "text-[14.5px] md:min-w-[22px]")}>{qty}</span>
      <button type="button" onClick={() => onChange(qty + 1)} disabled={qty >= max} aria-label="Increase quantity" className={cn("flex items-center justify-center text-ink disabled:opacity-30", btn)}>
        <Plus size={icon} strokeWidth={2.3} />
      </button>
    </div>
  );
}

function Status({ product }) {
  const onSale = product.salePrice != null && product.salePrice < product.price;
  if (onSale) {
    return (
      <div className="flex items-baseline gap-[7px] text-xs">
        <span className="font-semibold text-brand-deep">On sale</span>
        <span className="text-[#A2A597] line-through">{formatTaka(product.price)}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-deep">
      <span className="size-1.5 rounded-full bg-brand" /> In stock
    </div>
  );
}

export function CartLineItem({ item, compact = false }) {
  const { updateQty, removeItem } = useCart();
  const { product, qty, lineTotal, stockIssue } = item;

  // Compact (drawer) always uses the mobile row regardless of breakpoint.
  const MobileRow = (
    <div className={cn("flex gap-3 rounded-[18px] border border-line bg-white p-3.5", compact ? "" : "md:hidden")}>
      <Thumb product={product} className="h-[74px] w-[78px]" />
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2">
          <div className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-faint">{product.brand?.name}</div>
          <button type="button" onClick={() => removeItem(product._id)} aria-label="Remove item" className="text-faint">
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        <Link to={`/products/${product.slug}`} className="mb-2 mt-[3px] line-clamp-2 block text-[13px] font-semibold leading-[1.3] text-ink hover:text-ink">{product.title}</Link>
        <div className="flex items-center justify-between">
          <QtyPill qty={qty} max={product.availableStock} onChange={(q) => updateQty(product._id, q)} size="sm" />
          <span className="text-[14.5px] font-bold text-ink">{formatTaka(lineTotal)}</span>
        </div>
      </div>
    </div>
  );

  if (compact) return MobileRow;

  return (
    <>
      {/* Desktop */}
      <div className="hidden items-center gap-4 rounded-[20px] border border-line bg-white p-[16px_18px] md:flex">
        <Thumb product={product} className="h-[88px] w-24" />
        <div className="min-w-0 flex-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-faint">{product.brand?.name}</div>
          <Link to={`/products/${product.slug}`} className="my-1 block text-[15px] font-semibold leading-[1.35] text-ink hover:text-ink">{product.title}</Link>
          {stockIssue ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-danger"><TriangleAlert className="size-3" /> Only {stockIssue.availableStock} left</span>
          ) : (
            <Status product={product} />
          )}
        </div>
        <QtyPill qty={qty} max={product.availableStock} onChange={(q) => updateQty(product._id, q)} />
        <div className="w-[88px] text-right text-base font-bold text-ink">{formatTaka(lineTotal)}</div>
        <button type="button" onClick={() => removeItem(product._id)} aria-label="Remove item" className="flex size-9 items-center justify-center rounded-full border border-line bg-white text-faint transition-colors hover:border-danger hover:text-danger">
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Mobile */}
      {MobileRow}
    </>
  );
}
