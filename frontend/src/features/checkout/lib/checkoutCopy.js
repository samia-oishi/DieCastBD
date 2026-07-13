import { formatTaka as fmt } from "@/lib/currency";
import { resolveItemPaymentRequirement } from "./paymentPlanPreview";

/** Derives the checkout redesign's view-model from the payment-plan availability
 * this app already computes (paymentPlanPreview.js → resolvePaymentOptionAvailability
 * + calculateAmountPaidPreview). PURE / read-only — it invents no money and
 * changes no business logic; the backend still re-validates and computes the
 * authoritative amounts on order creation.
 *
 * The design handoff models one `paymentRule` (cod|delivery|partial|full) + a
 * flat `advanceAmount`. This app instead has, per PRODUCT, a `paymentOptions[]`
 * array + an `advancePaymentPercent` (a PERCENT of subtotal, not a flat taka),
 * plus a zone-level `requiresPrepay` flag that can disable COD on its own. So
 * the design's rule/min are *derived* here rather than fetched:
 *
 *   rule = cod when COD is available; otherwise named after the CHEAPEST
 *          non-COD option the whole cart allows (that option IS the design's
 *          "minimum to confirm").
 *   min  = that option's amountPaid — for partialAdvance that's
 *          round(subtotal × advancePaymentPercent / 100), clamped to total.
 */
export function deriveCheckoutView({ items, availability, nonCodOptions, total, paymentMethod, paymentOption }) {
  const codAllowed = Boolean(availability?.cod);

  // The cheapest non-COD option that isn't "full" is the design's "minimum to
  // confirm". Falls back to full (= the whole total) when it's the only choice.
  const minOption =
    [...nonCodOptions]
      .filter((o) => o.key !== "full")
      .sort((a, b) => a.amountPaid - b.amountPaid)[0] ?? null;
  const fullOption = nonCodOptions.find((o) => o.key === "full") ?? null;
  const min = minOption ? minOption.amountPaid : total;

  // The item that actually costs the customer their COD — named once, in the
  // banner, exactly as the handoff asks. When the ZONE is what disabled COD
  // (every product would have allowed it), there is no triggering product, and
  // the copy below falls back to a zone message instead.
  const triggerProduct =
    items.find((i) => !resolveItemPaymentRequirement(i.product).allowsCod)?.product?.title ?? null;

  const rule = codAllowed
    ? "cod"
    : minOption?.key === "partialAdvance"
      ? "partial"
      : minOption?.key === "deliveryOnly"
        ? "delivery"
        : "full";

  const isCod = paymentMethod === "cod";
  const selected = isCod ? null : nonCodOptions.find((o) => o.key === paymentOption);
  const payNow = isCod ? 0 : (selected?.amountPaid ?? total);
  const due = total - payNow;

  // Two plans to choose between (the design's "What are you paying now?") only
  // exist when there's a cheaper option alongside paying in full.
  const selectorVisible = !isCod && nonCodOptions.length > 1;

  const remainder = total - min;

  /* Copy rules (checkout-microcopy research): one doubt per line; state the
   * exact problem; and don't restate what's already on screen. Every amount here
   * is ALREADY shown in the plan cards, the split-bar legend and the summary's
   * Pay-now/Cash-on-delivery box — so the banners carry the *reason*, and only
   * the headline number (the advance) is repeated, because that's the one figure
   * a customer scans for. */
  const BANNERS = {
    cod: {
      title: "Cash on Delivery works for this order.",
      body: "Pay the rider when it arrives — or settle now with bKash or BanglaQR.",
    },
    delivery: {
      title: "Prepay the delivery charge to confirm.",
      body: "Pay it with bKash or BanglaQR. The rest is cash on delivery.",
    },
    partial: {
      // The advance is the headline number — worth keeping in the title.
      title: `A ${fmt(min)} advance reserves your piece.`,
      body: triggerProduct
        ? `${triggerProduct} is a pre-order. Pay the advance now, the rest on delivery.`
        : "This is a pre-order. Pay the advance now, the rest on delivery.",
    },
    full: {
      title: "Full payment confirms this order.",
      body: "Pay with bKash or BanglaQR — nothing left to pay at your door.",
    },
  };

  return {
    rule,
    codAllowed,
    min,
    payNow,
    due,
    remainder,
    selectorVisible,
    minOption,
    fullOption,
    banner: BANNERS[rule],

    // The row already carries an "UNAVAILABLE" chip, so this line only has to
    // answer *why*. It stays rule-based rather than naming the product: the
    // banner directly above already names it, and product titles here run to 40+
    // characters — repeating one twice inside 100px is what made this section
    // feel wordy.
    codSub: codAllowed
      ? "Pay the rider when your order arrives."
      : !triggerProduct
        ? "Your delivery zone needs prepayment." // zone-forced; no product to blame
        : rule === "partial"
          ? "Pre-orders need an advance to confirm."
          : rule === "delivery"
            ? "This order needs the delivery charge prepaid."
            : "This order must be paid in full.",

    // Shown instead of the two plan cards when a digital method is chosen but
    // there's nothing to choose (full is the only option).
    staticNote: "You're paying in full — nothing due on delivery.",

    plans: {
      a: minOption && {
        key: minOption.key,
        title: `Pay ${fmt(min)} now`,
        sub: `${fmt(remainder)} in cash at your door`,
      },
      b: fullOption && {
        key: "full",
        title: `Pay ${fmt(total)} now`,
        sub: "Nothing to pay on delivery",
      },
    },

    // The button carries the amount; the sub-line answers "what happens next?"
    // rather than repeating the split box directly above it.
    cta: {
      label: isCod ? `Place order · ${fmt(total)} due on delivery` : `Pay ${fmt(payNow)} & place order`,
      sub: isCod
        ? "Keep the cash ready — the rider will call ahead."
        : due > 0
          ? "The rest is cash on delivery."
          : "Nothing left to pay on delivery.",
    },

    // Split bar: "now" is never thinner than 4% so it stays visible.
    barNowPct: total > 0 ? Math.max(4, Math.round((payNow / total) * 100)) : 0,
  };
}
