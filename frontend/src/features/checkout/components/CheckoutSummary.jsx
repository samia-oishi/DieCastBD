import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { cloudinaryCard } from "@/lib/cloudinary";
import { CouponRow } from "@/features/cart/components/CouponRow";

function OrderItem({ item }) {
  const { product, qty } = item;
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-[52px] shrink-0 overflow-hidden rounded-[10px] bg-tile md:size-14">
        {product.thumbnail?.url && <img src={cloudinaryCard(product.thumbnail.url)} alt="" className="size-full object-contain p-1" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-[13px] font-semibold leading-[1.35] text-ink">{product.title}</div>
        <div className="mt-0.5 text-[12px] text-faint">Qty {qty}</div>
      </div>
      <span className="text-[13.5px] font-bold text-ink">{formatTaka(item.lineTotal)}</span>
    </div>
  );
}

/** Order summary card. Desktop is the full sticky card with the Place-order
 * submit button; on mobile the button lives in the sticky bar (variant="mobile"). */
export function CheckoutSummary({ variant = "desktop", items, subtotal, shipping, discount, total, coupon, onApplyCoupon, onRemoveCoupon, isPending, disabled }) {
  const isMobile = variant === "mobile";
  return (
    <div className={cn("border border-line bg-white", isMobile ? "rounded-[18px] p-[18px]" : "sticky top-[98px] rounded-3xl p-[26px]")}>
      <div className="font-display text-[19px] font-bold text-ink">Your order</div>

      <div className="mt-[18px] flex flex-col gap-3.5">
        {items.map((item) => <OrderItem key={item.product._id} item={item} />)}
      </div>

      <div className="mt-[18px] border-t border-line-soft pt-4">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold text-ink">{formatTaka(subtotal)}</span></div>
        <div className="mt-3 flex justify-between text-sm"><span className="text-muted-foreground">Shipping <span className="text-[#A2A597]">· {shipping.name}</span></span><span className="font-semibold text-ink">{shipping.free ? "Free" : formatTaka(shipping.fee)}</span></div>
        {discount > 0 && <div className="mt-3 flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span className="font-semibold text-brand-deep">−{formatTaka(discount)}</span></div>}
        <div className="mt-4 flex items-baseline justify-between border-t border-line-soft pt-4">
          <span className="text-[15px] font-bold text-ink">Total</span>
          <span className="font-display text-[22px] font-extrabold text-ink">{formatTaka(total)}</span>
        </div>
      </div>

      <CouponRow subtotal={subtotal} coupon={coupon} onApply={onApplyCoupon} onRemove={onRemoveCoupon} className="mt-[18px]" />

      {!isMobile && (
        <>
          <button type="submit" disabled={isPending || disabled} className="mt-4 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-brand text-[15.5px] font-bold text-ink transition-colors hover:bg-brand-bright disabled:opacity-60">
            {isPending ? "Placing order…" : `Place order · ${formatTaka(total)}`}
          </button>
          <p className="mt-3 text-center text-xs leading-[1.5] text-muted-foreground">By placing your order you agree to our Terms &amp; Refund Policy.</p>
        </>
      )}
    </div>
  );
}
