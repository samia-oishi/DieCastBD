import { ShieldCheck } from "lucide-react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { cloudinaryThumb } from "@/lib/cloudinary";
import { ROUTES } from "@/constants/routes";
import { CouponRow } from "@/features/cart/components/CouponRow";

function OrderItem({ item }) {
  const { product, qty } = item;
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-tile">
        {product.thumbnail?.url ? (
          <img src={cloudinaryThumb(product.thumbnail.url)} alt="" loading="lazy" decoding="async" className="h-full w-auto max-w-none" />
        ) : (
          <span className="text-[10px] font-bold text-faint">1:64</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {product.brand?.name && (
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-faint">{product.brand.name}</div>
        )}
        <div className="mt-0.5 line-clamp-2 text-[13.5px] font-semibold leading-[1.35] text-ink">{product.title}</div>
        <div className="mt-0.5 text-[12.5px] text-faint">Qty {qty}</div>
      </div>
      <span className="shrink-0 text-sm font-bold text-ink">{formatTaka(item.lineTotal)}</span>
    </div>
  );
}

function Row({ label, value, className }) {
  return (
    <div className={cn("flex justify-between text-[12.5px] md:text-[13.5px]", className)}>
      <span className="text-[#6B6E60]">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

/** The Pay now / Cash on delivery split box — the heart of the redesign's
 * "always show exactly what's paid now vs handed to the rider". */
function SplitBox({ payNow, due }) {
  return (
    <div className="mt-[11px] rounded-[11px] bg-[#FAFAF7] px-3 py-[11px] md:mt-3.5 md:rounded-[14px] md:px-[15px] md:py-[13px]">
      <div className="flex items-center gap-2">
        <span className="size-[7px] shrink-0 rounded-full bg-brand md:size-2" />
        <span className="flex-1 text-xs font-semibold text-ink-soft md:text-[13px]">Pay now</span>
        <b className="text-[12.5px] font-bold text-ink md:text-sm">{formatTaka(payNow)}</b>
      </div>
      <div className="mt-1.5 flex items-center gap-2 md:mt-2">
        <span className="size-[7px] shrink-0 rounded-full bg-[#D8DACC] md:size-2" />
        <span className="flex-1 text-xs font-semibold text-ink-soft md:text-[13px]">Cash on delivery</span>
        <b className="text-[12.5px] font-bold text-ink md:text-sm">{formatTaka(due)}</b>
      </div>
    </div>
  );
}

/** Order summary. Desktop is the sticky card carrying the submit CTA; on mobile
 * the CTA lives in the sticky pay bar, so the card omits it. */
export function CheckoutSummary({
  variant = "desktop",
  items,
  subtotal,
  shipping,
  discount,
  total,
  coupon,
  onApplyCoupon,
  onRemoveCoupon,
  isPending,
  disabled,
  view,
}) {
  const isMobile = variant === "mobile";
  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <div
      className={cn(
        "border border-line bg-white",
        // The desktop card is NOT sticky itself — CheckoutPage's grid item is (see there).
        isMobile ? "rounded-[16px] p-4" : "rounded-[20px] px-6 py-[22px]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-[15px] font-bold text-ink md:text-[17px]">Your order</span>
        <span className="rounded-full bg-tile px-[11px] py-1 text-xs font-semibold text-[#6B6E60]">
          {count} item{count !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="mt-3.5 flex flex-col gap-3 md:mt-4">
        {items.map((item) => (
          <OrderItem key={item.product._id} item={item} />
        ))}
      </div>

      <div className="my-3 h-px bg-line-soft md:my-4" />

      <Row label="Subtotal" value={formatTaka(subtotal)} />
      <Row
        label={`Shipping · ${shipping.name}`}
        value={shipping.free ? "Free" : formatTaka(shipping.fee)}
        className="mt-[7px] md:mt-[9px]"
      />
      {discount > 0 && (
        <Row
          label={`Discount${coupon?.code ? ` · ${coupon.code}` : ""}`}
          value={`−${formatTaka(discount)}`}
          className="mt-[7px] md:mt-[9px]"
        />
      )}

      <CouponRow subtotal={subtotal} coupon={coupon} onApply={onApplyCoupon} onRemove={onRemoveCoupon} className="mt-3.5" />

      <div className="my-3 h-px bg-line-soft md:my-4" />

      <div className="flex items-baseline justify-between">
        <span className="text-[13.5px] font-bold text-ink md:text-[15px]">Total</span>
        <span className="font-display text-[19px] font-extrabold tracking-[-0.01em] text-ink md:text-2xl">
          {formatTaka(total)}
        </span>
      </div>

      {/* Only when the money is genuinely split (see checkoutCopy.js). */}
      {view.splitVisible && <SplitBox payNow={view.payNow} due={view.due} />}

      {!isMobile && (
        <>
          <button
            type="submit"
            disabled={isPending || disabled}
            className="mt-4 w-full rounded-full bg-brand px-5 py-[15px] text-center font-display text-[15px] font-extrabold text-ink transition-colors duration-150 hover:bg-brand-bright disabled:opacity-60"
          >
            {isPending ? "Placing order…" : view.cta.label}
          </button>
          <p className="mt-2.5 text-center text-[12.5px] leading-[1.55] text-faint">{view.cta.sub}</p>

          <div className="mb-3 mt-4 h-px bg-line-soft" />

          <div className="flex items-center justify-center gap-[7px] text-xs text-[#6B6E60]">
            <ShieldCheck size={13} strokeWidth={2} className="text-brand-deep" />
            Hand-verified authentic · Collector-grade packing
          </div>
          <p className="mt-2.5 text-center text-[11.5px] text-[#A2A499]">
            By placing this order you agree to our{" "}
            <Link to={ROUTES.TERMS} className="text-[#6B6E60]">Terms</Link> &amp;{" "}
            <Link to={ROUTES.REFUND_POLICY} className="text-[#6B6E60]">Refund Policy</Link>.
          </p>
        </>
      )}
    </div>
  );
}
