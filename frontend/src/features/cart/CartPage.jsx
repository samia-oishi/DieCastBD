import { Link } from "react-router";
import { ShoppingBag, ArrowLeft } from "lucide-react";

import { Seo } from "@/components/shared/Seo";
import { Container } from "@/components/shared/Container";
import { ROUTES } from "@/constants/routes";
import { useSettings } from "@/features/settings/api/useSettings";
import { useCartStore } from "@/stores/cartStore";
import { useCart } from "./api/useCart";
import { CartLineItem } from "./components/CartLineItem";
import { CartSummaryCard } from "./components/CartSummaryCard";
import { MobileCartBar } from "./components/MobileCartBar";

function couponDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  const raw = coupon.type === "percentage" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return Math.min(raw, subtotal);
}

function ContinueShopping({ className }) {
  return (
    <Link to={ROUTES.SHOP} className={`inline-flex items-center gap-2 text-[13px] font-semibold text-ink md:text-sm ${className ?? ""}`}>
      <ArrowLeft size={15} strokeWidth={2} /> Continue shopping
    </Link>
  );
}

export function CartPage() {
  const { items, subtotal, itemCount, isLoading } = useCart();
  const { data: settings } = useSettings();
  const coupon = useCartStore((s) => s.coupon);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const clearCoupon = useCartStore((s) => s.clearCoupon);

  const zone = settings?.shippingZones?.[0] ?? { name: "Standard", fee: 0 };
  const freeThreshold = settings?.freeShippingThreshold;
  const freeShipping = freeThreshold != null && subtotal >= freeThreshold;
  const shipping = { name: zone.name, fee: zone.fee, free: freeShipping };

  const discount = couponDiscount(coupon, subtotal);
  const total = Math.max(0, subtotal - discount) + (freeShipping ? 0 : zone.fee);

  const summaryProps = {
    subtotal,
    shipping,
    discount,
    total,
    coupon,
    onApplyCoupon: setCoupon,
    onRemoveCoupon: clearCoupon,
  };

  if (!isLoading && items.length === 0) {
    return (
      <>
        <Seo title="Your Cart" />
        <Container className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-tile text-faint">
            <ShoppingBag className="size-7" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink">Your cart is empty</h1>
            <p className="mt-1.5 text-muted-foreground">Add a few pieces to your shelf.</p>
          </div>
          <Link to={ROUTES.SHOP} className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-brand-bright">
            Browse the collection
          </Link>
        </Container>
      </>
    );
  }

  return (
    <>
      <Seo title="Your Cart" />

      {/* Desktop */}
      <div className="mx-auto hidden w-full max-w-[1160px] px-10 pt-10 md:block">
        <h1 className="font-display text-[34px] font-extrabold tracking-[-0.02em] text-ink">Your cart</h1>
        <p className="mt-2 text-[14.5px] text-muted-foreground">{itemCount} pieces reserved for you — stock is held while you check out.</p>
        <div className="mt-7 grid grid-cols-[1.55fr_1fr] items-start gap-8">
          <div className="flex flex-col gap-3.5">
            {items.map((item) => <CartLineItem key={item.product._id} item={item} />)}
            <ContinueShopping className="mt-1.5" />
          </div>
          <CartSummaryCard variant="desktop" {...summaryProps} />
        </div>
      </div>

      {/* Mobile */}
      <div className="pb-28 md:hidden">
        <div className="mx-4 mt-4 flex flex-col gap-3">
          {items.map((item) => <CartLineItem key={item.product._id} item={item} />)}
          <CartSummaryCard variant="mobile" {...summaryProps} />
          <ContinueShopping className="mb-2 mt-1" />
        </div>
        <MobileCartBar total={total} />
      </div>
    </>
  );
}
