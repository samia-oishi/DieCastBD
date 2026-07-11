import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, ShieldCheck, Tag, X } from "lucide-react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { ROUTES } from "@/constants/routes";
import { useValidateCouponMutation } from "@/features/checkout/api/useCoupon";

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

function CouponRow({ subtotal, coupon, onApply, onRemove }) {
  const [code, setCode] = useState("");
  const validate = useValidateCouponMutation();

  if (coupon) {
    return (
      <div className="mt-[18px] flex items-center justify-between rounded-full border border-brand/50 bg-brand-tint/40 px-4 py-2.5 text-[13px]">
        <span className="flex items-center gap-2 font-semibold text-ink"><Tag className="size-3.5 text-brand-deep" /> {coupon.code} applied</span>
        <button type="button" onClick={onRemove} aria-label="Remove coupon" className="text-faint hover:text-danger"><X className="size-4" /></button>
      </div>
    );
  }

  const apply = () => {
    if (!code.trim()) return;
    validate.mutate(
      { code: code.trim(), subtotal },
      {
        onSuccess: (result) => { onApply(result); setCode(""); },
        onError: (e) => toast.error(e?.response?.data?.message || "Invalid coupon"),
      }
    );
  };

  return (
    <div className="mt-[18px] flex gap-2.5">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), apply())}
        placeholder="Coupon code"
        className="min-w-0 flex-1 rounded-full border border-line bg-paper px-[18px] py-3 text-[13.5px] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      />
      <button type="button" onClick={apply} disabled={validate.isPending} className="shrink-0 rounded-full border-[1.5px] border-ink px-5 py-3 text-[13.5px] font-bold text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-50">
        {validate.isPending ? "…" : "Apply"}
      </button>
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

      <CouponRow subtotal={subtotal} coupon={coupon} onApply={onApplyCoupon} onRemove={onRemoveCoupon} />

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
