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
      {/* Proportional halves, not equal ones — "Add to cart" is the longer
          label, and an even flex-1 split wrapped it onto two lines on small
          screens. nowrap guarantees one line; the bag icon yields first on
          very narrow viewports so the text never has to. */}
      <button type="button" onClick={onAdd} className="flex h-[46px] flex-[1.35] items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-brand px-2 text-[13px] font-extrabold text-ink">
        <ShoppingBag size={14} strokeWidth={2} className="hidden min-[360px]:block" />
        Add to cart
      </button>
      <button type="button" onClick={onBuyNow} className="flex h-[46px] flex-1 items-center justify-center whitespace-nowrap rounded-full bg-white px-2 text-[13px] font-extrabold text-ink">
        Buy now
      </button>
    </div>
  );
}
