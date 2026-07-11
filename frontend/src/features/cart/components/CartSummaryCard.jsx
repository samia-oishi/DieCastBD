import { Link } from "react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { ROUTES } from "@/constants/routes";
import { CouponRow } from "./CouponRow";

const PAYMENTS = ["COD", "bKash", "BanglaQR"];

function PaymentPills({ small }) {
  return (
    <div className="mt-3.5 flex justify-center gap-2 md:mt-4">
      {PAYMENTS.map((p) => (
        <span key={p} className={cn("rounded-full border border-line font-semibold text-[#55584C]", small ? "px-[11px] py-1 text-[10.5px]" : "px-3 py-[5px] text-[11.5px]")}>
          {p}
        </span>
      ))}
    </div>
  );
}

/** Order summary. `variant="desktop"` is the full sticky card (with Total,
 * Checkout, authenticity); `variant="mobile"` is the compact card (Total +
 * Checkout live in the sticky bar). */
export function CartSummaryCard({ variant = "desktop", subtotal, shipping, discount, total, coupon, onApplyCoupon, onRemoveCoupon }) {
  const isMobile = variant === "mobile";
  return (
    <div className={cn("border border-line bg-white", isMobile ? "rounded-[18px] p-[18px]" : "sticky top-[98px] rounded-3xl p-[26px]")}>
      {!isMobile && <div className="font-display text-[19px] font-bold text-ink">Order summary</div>}

      <div className={cn("flex justify-between text-[13px] md:text-sm", isMobile ? "" : "mt-[18px]")}>
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-semibold text-ink">{formatTaka(subtotal)}</span>
      </div>
      <div className="mt-2.5 flex justify-between text-[13px] md:mt-3 md:text-sm">
        <span className="text-muted-foreground">Shipping <span className="text-[#A2A597]">· {shipping.name}</span></span>
        <span className="font-semibold text-ink">{shipping.free ? "Free" : formatTaka(shipping.fee)}</span>
      </div>
      {discount > 0 && (
        <div className="mt-2.5 flex justify-between text-[13px] md:mt-3 md:text-sm">
          <span className="text-muted-foreground">Discount</span>
          <span className="font-semibold text-brand-deep">−{formatTaka(discount)}</span>
        </div>
      )}

      {!isMobile && (
        <div className="mt-4 flex items-baseline justify-between border-t border-line-soft pt-4">
          <span className="text-[15px] font-bold text-ink">Total</span>
          <span className="font-display text-[22px] font-extrabold text-ink">{formatTaka(total)}</span>
        </div>
      )}

      <CouponRow subtotal={subtotal} coupon={coupon} onApply={onApplyCoupon} onRemove={onRemoveCoupon} className="mt-[18px]" />

      {!isMobile && (
        <Link to={ROUTES.CHECKOUT} className="mt-4 flex h-[52px] items-center justify-center gap-2.5 rounded-full bg-brand text-[15.5px] font-bold text-ink transition-colors hover:bg-brand-bright">
          Checkout <ArrowRight size={16} strokeWidth={2.2} />
        </Link>
      )}

      <PaymentPills small={isMobile} />

      {!isMobile && (
        <div className="mt-3 flex items-center justify-center gap-[7px] text-xs text-muted-foreground">
          <ShieldCheck size={13} strokeWidth={2} className="text-brand-deep" />
          Verified authentic · collector-grade packing
        </div>
      )}
    </div>
  );
}
