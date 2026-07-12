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
// has no special-case "mixed cart" detection beyond the per-item loop: a cart
// mixing a cod-only item with a partialAdvance-required item is rejected no
// matter which of the two paymentOptions is chosen, because whichever one is
// picked, the OTHER item in the loop below fails its own check — exactly the
// "rejected with a message, not silently split" behavior the requirement
// calls for.
//
// zoneRequiresPrepay is a COD-disabling mechanism scoped to items that offer
// cod — NOT a blanket cart-wide override. For a cod-offering item in a forcing
// zone, cod is disabled and the customer must instead pay at least the delivery
// charge (or the full amount) to confirm, so those two prepay alternatives are
// force-offered (see zoneForcesItem below). Items that never offered cod in the
// first place (deliveryOnly-only, partialAdvance, etc.) are completely
// unaffected by the zone flag — it neither adds nor removes any option for them,
// so they behave identically inside or outside a forcing zone. partialAdvance
// is never touched by the zone flag at all.
export function assertPaymentMethodAllowed({ normalizedItems, paymentOption, zoneRequiresPrepay }) {
  for (const { product } of normalizedItems) {
    const requirement = resolveItemPaymentRequirement(product);

    // The zone force only bites on an item that actually offers cod: disabling
    // that item's cod is the whole point, and the delivery-charge/full prepay
    // alternatives exist to give it somewhere to go. An item with no cod to
    // disable is left exactly as its own paymentOptions configured it.
    const zoneForcesItem = zoneRequiresPrepay && requirement.allowsCod;

    const allowed =
      (paymentOption === "cod" && requirement.allowsCod && !zoneRequiresPrepay) ||
      // The zone-forced case is itself satisfied by paying just the delivery
      // charge OR the full amount upfront — the customer gets a choice of
      // either, even though the product never opted into "Delivery Charge
      // Only"/"Full Payment" as business options on its own.
      (paymentOption === "deliveryOnly" && (requirement.allowsDeliveryOnly || zoneForcesItem)) ||
      (paymentOption === "partialAdvance" && requirement.requiresAdvance) ||
      (paymentOption === "full" && (requirement.allowsFull || zoneForcesItem));

    if (!allowed) {
      if (paymentOption === "cod" && zoneForcesItem) {
        throw ApiError.badRequest(
          `"${product.title}" can only be ordered with Cash on Delivery, but this delivery zone requires paying the delivery charge upfront — please choose Delivery Charge Only, Partial Advance, or Full Payment instead.`
        );
      }
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
