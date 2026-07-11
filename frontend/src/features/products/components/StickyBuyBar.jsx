import { Minus, Plus, ShoppingBag } from "lucide-react";

/** Mobile-only fixed buy bar (replaces the bottom nav on the PDP): dark-glass
 * qty stepper + lime Add to cart + white Buy now. */
export function StickyBuyBar({ qty, onQty, max, onAdd, onBuyNow, outOfStock }) {
  if (outOfStock) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-2 rounded-[22px] border border-white/16 bg-[rgba(13,15,7,0.92)] p-[10px] shadow-[0_10px_30px_rgba(16,18,8,0.45)] [backdrop-filter:blur(22px)_saturate(160%)] [-webkit-backdrop-filter:blur(22px)_saturate(160%)] md:hidden">
      <div className="flex h-11 shrink-0 items-center rounded-full border border-white/14 bg-white/[0.08]">
        <button type="button" onClick={() => onQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="flex h-11 w-[34px] items-center justify-center text-white disabled:opacity-30">
          <Minus size={12} strokeWidth={2.4} />
        </button>
        <span className="min-w-[18px] text-center text-sm font-bold text-white tabular-nums">{qty}</span>
        <button type="button" onClick={() => onQty(Math.min(max, qty + 1))} disabled={qty >= max} aria-label="Increase quantity" className="flex h-11 w-[34px] items-center justify-center text-white disabled:opacity-30">
          <Plus size={12} strokeWidth={2.4} />
        </button>
      </div>
      <button type="button" onClick={onAdd} className="flex h-[46px] flex-1 items-center justify-center gap-1.5 rounded-full bg-brand text-[13px] font-extrabold text-ink">
        <ShoppingBag size={14} strokeWidth={2} />
        Add to cart
      </button>
      <button type="button" onClick={onBuyNow} className="flex h-[46px] flex-1 items-center justify-center rounded-full bg-white text-[13px] font-extrabold text-ink">
        Buy now
      </button>
    </div>
  );
}
