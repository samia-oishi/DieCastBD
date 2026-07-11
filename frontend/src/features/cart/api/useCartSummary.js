import { useSettings } from "@/features/settings/api/useSettings";
import { useCartStore } from "@/stores/cartStore";
import { useCart } from "./useCart";

function couponDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  const raw = coupon.type === "percentage" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return Math.min(raw, subtotal);
}

/** Single source for the cart's money math + coupon controls, shared by the
 * Cart page and the cart drawer so their summaries can never drift. Shipping is
 * a preview from the first zone (free over the threshold); checkout is
 * authoritative. */
export function useCartSummary() {
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

  return { items, itemCount, subtotal, isLoading, shipping, discount, total, coupon, setCoupon, clearCoupon };
}
