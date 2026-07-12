import { ApiError } from "../../utils/apiError.js";

/** Per-product payment-option resolution — shared math so a product's payment
 * rules can never drift between admin display, cart/checkout preview, and
 * order creation, mirroring the coupon.service.js shared-math pattern.
 * Pure and synchronous: reads only the product's own paymentOptions/
 * advancePaymentPercent fields, no DB access.
 *
 * Created in Phase 2 and unit-tested in isolation; wired into buildAndSaveOrder
 * (order.service.js) in Phase 4 via assertPaymentMethodAllowed/calculateAmountPaid
 * below.
 */
export function resolveItemPaymentRequirement(product) {
  const options = product?.paymentOptions?.length ? product.paymentOptions : ["cod", "full"];
  const requiresAdvance = options.includes("partialAdvance");
  return {
    allowsCod: options.includes("cod"),
    allowsDeliveryOnly: options.includes("deliveryOnly"),
    allowsFull: options.includes("full"),
    requiresAdvance,
    advancePercent: requiresAdvance ? (product?.advancePaymentPercent ?? null) : null,
  };
}

// Validates the single order-level paymentOption against every item's own
// allowed options AND the destination zone's requiresPrepay flag. Deliberately
// has no special-case "mixed cart" detection: a cart mixing a cod-only item
// with a partialAdvance-required item is rejected no matter which of the two
// paymentOptions is chosen, because whichever one is picked, the OTHER item in
// the loop below fails its own check — exactly the "rejected with a message,
// not silently split" behavior the requirement calls for.
export function assertPaymentMethodAllowed({ normalizedItems, paymentOption, zoneRequiresPrepay }) {
  // Outside-Dhaka prepay is a shipping-zone rule, not a product rule, so it's
  // checked independently of the per-item loop: no product config can override
  // a zone that requires the delivery charge to be paid upfront.
  if (zoneRequiresPrepay && paymentOption === "cod") {
    throw ApiError.badRequest(
      "Cash on Delivery isn't available for this delivery zone — the delivery charge must be paid upfront."
    );
  }

  for (const { product } of normalizedItems) {
    const requirement = resolveItemPaymentRequirement(product);
    const allowed =
      (paymentOption === "cod" && requirement.allowsCod) ||
      (paymentOption === "deliveryOnly" && requirement.allowsDeliveryOnly) ||
      (paymentOption === "partialAdvance" && requirement.requiresAdvance) ||
      (paymentOption === "full" && requirement.allowsFull);

    if (!allowed) {
      throw ApiError.badRequest(
        `"${product.title}" cannot be ordered with the selected payment option — please choose a different payment method.`
      );
    }
  }
}

// Computes how much of the order total is collected now vs. left as balance
// due on delivery, for the chosen paymentOption. Pure math over the already-
// resolved subtotal/total/shippingFee so preview and order creation can never
// disagree, mirroring coupon.service.js's calculateDiscount.
//
// partialAdvance across multiple differently-configured products: takes the
// MAX advancePercent among the partialAdvance-requiring items in the cart,
// applied to subtotal — this never under-collects relative to any single
// item's own configured advance percentage.
export function calculateAmountPaid({ normalizedItems, subtotal, total, shippingFee, paymentOption }) {
  if (paymentOption === "full") {
    return { amountPaid: total, amountDue: 0, advancePaymentPercent: null };
  }

  if (paymentOption === "deliveryOnly") {
    const amountPaid = Math.min(shippingFee, total);
    return { amountPaid, amountDue: total - amountPaid, advancePaymentPercent: null };
  }

  if (paymentOption === "partialAdvance") {
    const percents = normalizedItems
      .map(({ product }) => resolveItemPaymentRequirement(product))
      .filter((r) => r.requiresAdvance && r.advancePercent != null)
      .map((r) => r.advancePercent);
    const advancePaymentPercent = percents.length ? Math.max(...percents) : 0;
    const amountPaid = Math.min(Math.round((subtotal * advancePaymentPercent) / 100), total);
    return { amountPaid, amountDue: total - amountPaid, advancePaymentPercent };
  }

  // cod — nothing collected upfront, full balance due on delivery.
  return { amountPaid: 0, amountDue: total, advancePaymentPercent: null };
}
