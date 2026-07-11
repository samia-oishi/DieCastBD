import { Link } from "react-router";
import { ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ROUTES } from "@/constants/routes";
import { formatTaka } from "@/lib/currency";
import { useCartSummary } from "../api/useCartSummary";
import { CartLineItem } from "./CartLineItem";
import { CouponRow } from "./CouponRow";

const PAYMENTS = ["COD", "bKash", "BanglaQR"];

function SummaryRow({ label, value, muted }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? "font-semibold text-brand-deep" : "font-semibold text-ink"}>{value}</span>
    </div>
  );
}

// Purely controlled sheet — SiteHeader / mobile app bar own the trigger buttons.
// Carries the full order summary from the Cart design (subtotal, shipping,
// coupon, total, payment pills, authenticity) so it's a complete cart, not a peek.
export function CartDrawer({ open, onOpenChange }) {
  const { items, itemCount, subtotal, shipping, discount, total, coupon, setCoupon, clearCoupon } = useCartSummary();
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 bg-paper p-5 sm:max-w-[420px]">
        <SheetHeader className="px-0 pb-2">
          <SheetTitle className="font-display text-[19px] font-bold text-ink">
            Your cart{itemCount > 0 ? ` (${itemCount})` : ""}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-tile text-faint">
              <ShoppingBag className="size-6" strokeWidth={1.5} />
            </div>
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link to={ROUTES.SHOP} onClick={close} className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-brand-bright">
              Browse the collection
            </Link>
          </div>
        ) : (
          <>
            <div className="-mx-1 flex flex-1 flex-col gap-2.5 overflow-y-auto px-1 py-2">
              {items.map((item) => (
                <CartLineItem key={item.product._id} item={item} compact />
              ))}
            </div>

            <div className="mt-2 flex flex-col gap-2.5 border-t border-line pt-4">
              <SummaryRow label="Subtotal" value={formatTaka(subtotal)} />
              <SummaryRow label={`Shipping · ${shipping.name}`} value={shipping.free ? "Free" : formatTaka(shipping.fee)} />
              {discount > 0 && <SummaryRow label="Discount" value={`−${formatTaka(discount)}`} muted />}

              <div className="flex items-baseline justify-between border-t border-line-soft pt-3">
                <span className="text-[15px] font-bold text-ink">Total</span>
                <span className="font-display text-[20px] font-extrabold text-ink">{formatTaka(total)}</span>
              </div>

              <CouponRow subtotal={subtotal} coupon={coupon} onApply={setCoupon} onRemove={clearCoupon} className="mt-1.5" />

              <Link to={ROUTES.CHECKOUT} onClick={close} className="mt-1.5 flex h-12 items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-bold text-ink transition-colors hover:bg-brand-bright">
                Checkout <ArrowRight size={16} strokeWidth={2.2} />
              </Link>
              <Link to={ROUTES.CART} onClick={close} className="flex h-11 items-center justify-center rounded-full border border-line bg-white text-sm font-semibold text-ink transition-colors hover:border-ink">
                View full cart
              </Link>

              <div className="mt-1 flex justify-center gap-2">
                {PAYMENTS.map((p) => (
                  <span key={p} className="rounded-full border border-line px-3 py-[5px] text-[11.5px] font-semibold text-[#55584C]">{p}</span>
                ))}
              </div>
              <div className="flex items-center justify-center gap-[7px] text-xs text-muted-foreground">
                <ShieldCheck size={13} strokeWidth={2} className="text-brand-deep" />
                Verified authentic · collector-grade packing
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
