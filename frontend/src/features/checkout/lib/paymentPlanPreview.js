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
 * zoneRequiresPrepay is a BLANKET OVERRIDE, not a per-item safety net: if the
 * zone requires prepay, "cod" is unavailable for the whole cart regardless of
 * any item's own paymentOptions (including the default cod+full), and both
 * "deliveryOnly"/"full" become available even for items that didn't
 * themselves opt into them. partialAdvance is untouched — gated purely on the
 * product's own configured advance percent. Mirrors the backend's
 * assertPaymentMethodAllowed. */
export function resolvePaymentOptionAvailability({ items, zoneRequiresPrepay }) {
  const requirements = items.map((item) => resolveItemPaymentRequirement(item.product));

  const availability = {};
  for (const option of ["cod", "deliveryOnly", "partialAdvance", "full"]) {
    availability[option] =
      requirements.length > 0 &&
      requirements.every((r) => {
        if (option === "cod") return r.allowsCod && !zoneRequiresPrepay;
        if (option === "deliveryOnly") return r.allowsDeliveryOnly || zoneRequiresPrepay;
        if (option === "full") return r.allowsFull || zoneRequiresPrepay;
        return OPTION_CHECKERS[option](r);
      });
  }

  const advancePercents = requirements
    .filter((r) => r.requiresAdvance && r.advancePercent != null)
    .map((r) => r.advancePercent);
  const advancePaymentPercent = advancePercents.length ? Math.max(...advancePercents) : null;

  let codDisabledReason = null;
  if (!availability.cod) {
    codDisabledReason = zoneRequiresPrepay
      ? "This delivery zone requires paying the delivery charge upfront — Cash on Delivery isn't available here."
      : "One or more items in your order require advance or delivery-charge payment and can't be ordered with Cash on Delivery.";
  }

  // Whether the zone's prepay requirement is binding — used by the checkout
  // UI to decide whether to show the "this zone requires prepay" callout.
  return { availability, advancePaymentPercent, codDisabledReason, zoneForcesPrepay: zoneRequiresPrepay };
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
