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
export function deriveCheckoutView({
  items,
  availability,
  nonCodOptions,
  codDisabledReason,
  total,
  paymentMethod,
  paymentOption,
}) {
  const codAllowed = Boolean(availability?.cod);

  // The cheapest non-COD option that isn't "full" is the design's "minimum to
  // confirm". Falls back to full (= the whole total) when it's the only choice.
  const minOption =
    [...nonCodOptions]
      .filter((o) => o.key !== "full")
      .sort((a, b) => a.amountPaid - b.amountPaid)[0] ?? null;
  const fullOption = nonCodOptions.find((o) => o.key === "full") ?? null;
  const min = minOption ? minOption.amountPaid : total;

  // The item that actually costs the customer their COD — used to name the
  // product in the banner/locked-COD copy, exactly as the handoff asks. When the
  // ZONE is what disabled COD (every product would have allowed it), there is no
  // triggering product, so we keep this app's accurate zone message instead.
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
  const piece = triggerProduct ?? "This piece";

  const BANNERS = {
    cod: {
      title: "Cash on Delivery works for this whole order.",
      body: "Nothing to pay until it reaches your door. Prefer to settle now? bKash and BanglaQR work too — your call.",
    },
    delivery: {
      title: "One small step to confirm — prepay the delivery charge.",
      // The handoff's literal copy says "the remaining ৳{subtotal}" — that's only
      // right when no coupon applies. We render the true remainder (total − min),
      // which is the same number absent a discount and correct with one.
      body: `This order ships once the ${fmt(min)} delivery charge lands. Pay it via bKash or BanglaQR, and hand the remaining ${fmt(remainder)} to the rider in cash.`,
    },
    partial: {
      title: `A ${fmt(min)} advance reserves your piece.`,
      body: `${piece} is an import pre-order, so we confirm it with a part payment. Pay ${fmt(min)} now via bKash or BanglaQR — the remaining ${fmt(remainder)} is cash on delivery.`,
    },
    full: {
      title: triggerProduct ? `${triggerProduct} needs full payment to confirm.` : "This piece needs full payment to confirm.",
      body: `Reserved imports are secured with the full ${fmt(total)} before they ship. The upside: nothing left to pay at your door.`,
    },
  };

  return {
    rule,
    codAllowed,
    min,
    payNow,
    due,
    selectorVisible,
    minOption,
    fullOption,
    banner: BANNERS[rule],

    codSub: codAllowed
      ? `Pay ${fmt(total)} in cash when your order arrives`
      : triggerProduct
        ? `Not available for this order — the ${triggerProduct} must be confirmed with a payment first`
        : // Zone-forced prepay: no product to name, so keep this app's real reason.
          (codDisabledReason ?? "Not available for this order"),

    // Shown instead of the two plan cards when a digital method is chosen but
    // there's nothing to choose (full is the only option).
    staticNote:
      rule === "full"
        ? `Full payment of ${fmt(total)} confirms this order — nothing due on delivery.`
        : `You're paying the full ${fmt(total)} now — nothing due on delivery.`,

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

    cta: {
      label: isCod ? `Place order · ${fmt(total)} due on delivery` : `Pay ${fmt(payNow)} & place order`,
      sub: isCod
        ? "Keep the exact amount ready — our rider will call before arriving."
        : due > 0
          ? `${fmt(due)} remains — hand it to the rider in cash when your order arrives.`
          : "All settled — just receive and unbox.",
    },

    // Split bar: "now" is never thinner than 4% so it stays visible.
    barNowPct: total > 0 ? Math.max(4, Math.round((payNow / total) * 100)) : 0,
  };
}
