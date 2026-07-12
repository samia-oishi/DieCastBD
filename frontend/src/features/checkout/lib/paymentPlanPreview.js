// Client-side PREVIEW ONLY, mirroring backend/src/modules/orders/paymentPlan.service.js
// (resolveItemPaymentRequirement/assertPaymentMethodAllowed/calculateAmountPaid).
// The two apps are separate packages with no shared code, so this is a small,
// deliberately-duplicated read-only mirror used purely to drive the checkout
// UI (disable COD, offer a delivery-only/advance/full segmented control,
// preview the amount due) — the backend re-validates and computes the
// authoritative amounts on order creation; nothing here is trusted for money.

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

const OPTION_CHECKERS = {
  cod: (r) => r.allowsCod,
  deliveryOnly: (r) => r.allowsDeliveryOnly,
  partialAdvance: (r) => r.requiresAdvance,
  full: (r) => r.allowsFull,
};

export const PAYMENT_OPTION_LABELS = {
  cod: "Cash on Delivery",
  deliveryOnly: "Delivery charge only",
  partialAdvance: "Partial advance",
  full: "Full payment",
};

/** For a cart's line items + the selected zone's requiresPrepay flag, works out
 * which of the 4 order-level paymentOptions are usable for the WHOLE cart
 * (every item must allow it — same rule as the backend's per-item loop, so a
 * cart mixing a cod-only item with a partialAdvance-required item naturally
 * ends up with neither "cod" nor "partialAdvance" universally available,
 * surfacing as a rejection message rather than a silent split).
 *
 * zoneRequiresPrepay is a COD-disabling mechanism scoped to items that offer
 * cod — NOT a blanket cart-wide override. For a cod-offering item in a forcing
 * zone, "cod" is disabled and "deliveryOnly"/"full" are force-offered as the
 * prepay alternatives (even though the product never opted into them on its
 * own). Items that never offered cod in the first place (deliveryOnly-only,
 * partialAdvance, etc.) are completely unaffected by the zone flag — it neither
 * adds nor removes any option for them, so they behave identically inside or
 * outside a forcing zone. partialAdvance is never touched by the zone flag at
 * all — gated purely on the product's own configured advance percent. Mirrors
 * the backend's assertPaymentMethodAllowed.
 *
 * The returned showPrepayNotice flag is deliberately cause-agnostic: it's true
 * whenever "cod" ends up unavailable for the cart, whether that's because the
 * zone forces prepay OR because one of the cart's own products is configured
 * without "cod" in its paymentOptions (independent of which zone/city is
 * selected) — the checkout UI shows the same prominent banner either way. */
export function resolvePaymentOptionAvailability({ items, zoneRequiresPrepay }) {
  const requirements = items.map((item) => resolveItemPaymentRequirement(item.product));

  const availability = {};
  for (const option of ["cod", "deliveryOnly", "partialAdvance", "full"]) {
    availability[option] =
      requirements.length > 0 &&
      requirements.every((r) => {
        // The zone force only bites on an item that actually offers cod:
        // disabling that item's cod is the whole point, and the delivery-
        // charge/full alternatives exist to give it somewhere to go. An item
        // with no cod to disable is left exactly as its own paymentOptions
        // configured it.
        const zoneForcesItem = zoneRequiresPrepay && r.allowsCod;
        if (option === "cod") return r.allowsCod && !zoneRequiresPrepay;
        if (option === "deliveryOnly") return r.allowsDeliveryOnly || zoneForcesItem;
        if (option === "full") return r.allowsFull || zoneForcesItem;
        return OPTION_CHECKERS[option](r);
      });
  }

  const advancePercents = requirements
    .filter((r) => r.requiresAdvance && r.advancePercent != null)
    .map((r) => r.advancePercent);
  const advancePaymentPercent = advancePercents.length ? Math.max(...advancePercents) : null;

  // The zone is only the genuine cause of cod-disablement when every item
  // actually offered cod (so absent the zone, cod would have been available).
  // If any item never offered cod, that product config is the real reason and
  // the zone message would be misleading (it disables nothing extra there).
  const zoneDisablesCod = zoneRequiresPrepay && requirements.every((r) => r.allowsCod);

  let codDisabledReason = null;
  if (!availability.cod) {
    codDisabledReason = zoneDisablesCod
      ? "This delivery zone requires paying the delivery charge upfront — Cash on Delivery isn't available here."
      : "One or more items in your order require advance or delivery-charge payment and can't be ordered with Cash on Delivery.";
  }

  // Whether to show the prominent "prepay required" banner — fires whenever
  // cod ends up unavailable for the cart at all, not just when the zone is
  // the cause (see the showPrepayNotice doc above the function).
  return { availability, advancePaymentPercent, codDisabledReason, showPrepayNotice: !availability.cod };
}

// Preview mirror of calculateAmountPaid — same math, non-authoritative.
export function calculateAmountPaidPreview({ subtotal, total, shippingFee, paymentOption, advancePaymentPercent }) {
  if (paymentOption === "full") return { amountPaid: total, amountDue: 0 };
  if (paymentOption === "deliveryOnly") {
    const amountPaid = Math.min(shippingFee, total);
    return { amountPaid, amountDue: total - amountPaid };
  }
  if (paymentOption === "partialAdvance") {
    const percent = advancePaymentPercent ?? 0;
    const amountPaid = Math.min(Math.round((subtotal * percent) / 100), total);
    return { amountPaid, amountDue: total - amountPaid };
  }
  return { amountPaid: 0, amountDue: total };
}
