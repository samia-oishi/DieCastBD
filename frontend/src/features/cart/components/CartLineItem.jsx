import { Link } from "react-router";
import { Minus, Plus, X, CarFront, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { cloudinaryCard } from "@/lib/cloudinary";
import { useCart } from "../api/useCart";

function Thumb({ product, className }) {
  return (
    <Link to={`/products/${product.slug}`} className={cn("relative shrink-0 overflow-hidden rounded-[12px] bg-tile md:rounded-[14px]", className)}>
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

// Per-unit price (sale + original struck through) shown with a "×qty" hint when
// more than one, plus the total line saving so the discount is clear. `qty`
// makes the Save reflect the whole line, not a single unit.
function PriceStatus({ product, qty, stockIssue }) {
  const onSale = product.salePrice != null && product.salePrice < product.price;
  const effective = onSale ? product.salePrice : product.price;
  const totalSave = (product.price - effective) * qty;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-[13.5px] font-bold text-ink">
        {formatTaka(effective)}
        {qty > 1 && <span className="ml-1 text-[11.5px] font-medium text-faint">× {qty}</span>}
      </span>
      {onSale && <span className="text-[12px] text-[#A2A597] line-through">{formatTaka(product.price)}</span>}
      {onSale && <span className="rounded-full bg-brand-tint px-2 py-[3px] text-[10px] font-bold text-brand-deep">Save {formatTaka(totalSave)}</span>}
      {stockIssue ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-danger"><TriangleAlert className="size-3" /> Only {stockIssue.availableStock} left</span>
      ) : (
        <span className="flex items-center gap-1 text-[11.5px] font-semibold text-brand-deep"><span className="size-1.5 rounded-full bg-brand" /> In stock</span>
      )}
    </div>
  );
}

function MobilePrice({ product, qty }) {
  const onSale = product.salePrice != null && product.salePrice < product.price;
  const effective = onSale ? product.salePrice : product.price;
  const totalSave = (product.price - effective) * qty;
  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <span className="text-[13px] font-bold text-ink">
        {formatTaka(effective)}
        {qty > 1 && <span className="ml-1 text-[11px] font-medium text-faint">× {qty}</span>}
      </span>
      {onSale && <span className="text-[11px] text-[#A2A597] line-through">{formatTaka(product.price)}</span>}
      {onSale && <span className="text-[10px] font-bold text-brand-deep">Save {formatTaka(totalSave)}</span>}
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
        <Link to={`/products/${product.slug}`} className="mt-[3px] line-clamp-2 block text-[13px] font-semibold leading-[1.3] text-ink hover:text-ink">{product.title}</Link>
        <MobilePrice product={product} qty={qty} />
        {stockIssue && (
          <div className="mb-2 flex items-center gap-1 text-[11px] font-semibold text-danger"><TriangleAlert className="size-3" /> Only {stockIssue.availableStock} left</div>
        )}
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
          <PriceStatus product={product} qty={qty} stockIssue={stockIssue} />
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
