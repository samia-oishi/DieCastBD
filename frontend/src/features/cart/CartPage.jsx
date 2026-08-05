import { Link } from "react-router";
import { ShoppingBag, ArrowLeft } from "lucide-react";

import { Seo } from "@/components/shared/Seo";
import { Container } from "@/components/shared/Container";
import { ROUTES } from "@/constants/routes";
import { useCartSummary } from "./api/useCartSummary";
import { CartLineItem } from "./components/CartLineItem";
import { CartSummaryCard } from "./components/CartSummaryCard";
import { MobileCartBar } from "./components/MobileCartBar";

function ContinueShopping({ className }) {
  return (
    <Link to={ROUTES.SHOP} className={`inline-flex items-center gap-2 text-[13px] font-semibold text-ink md:text-sm ${className ?? ""}`}>
      <ArrowLeft size={15} strokeWidth={2} /> Continue shopping
    </Link>
  );
}

export function CartPage() {
  const { items, itemCount, subtotal, isLoading, shipping, discount, total, coupon, setCoupon, clearCoupon } = useCartSummary();

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
        <Seo title="Your Cart" noindex />
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
      <Seo title="Your Cart" noindex />

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
