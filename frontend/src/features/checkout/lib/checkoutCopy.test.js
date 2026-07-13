import { describe, it, expect } from "vitest";

import { resolvePaymentOptionAvailability, calculateAmountPaidPreview } from "./paymentPlanPreview";
import { deriveCheckoutView } from "./checkoutCopy";

/** Builds the same inputs CheckoutPage feeds deriveCheckoutView, straight from
 * the real availability logic — so these assert the whole chain
 * (product paymentOptions → availability → amounts → the redesign's view-model),
 * not just the copy layer in isolation. */
function view({ products, zoneRequiresPrepay = false, subtotal, shippingFee, paymentMethod, paymentOption }) {
  const items = products.map((product) => ({ product, qty: 1 }));
  const total = subtotal + shippingFee;
  const plan = resolvePaymentOptionAvailability({ items, zoneRequiresPrepay });
  const nonCodOptions = ["deliveryOnly", "partialAdvance", "full"]
    .filter((key) => plan.availability[key])
    .map((key) => ({
      key,
      ...calculateAmountPaidPreview({
        subtotal,
        total,
        shippingFee,
        paymentOption: key,
        advancePaymentPercent: plan.advancePaymentPercent,
      }),
    }));
  return deriveCheckoutView({
    items,
    availability: plan.availability,
    nonCodOptions,
    codDisabledReason: plan.codDisabledReason,
    total,
    paymentMethod,
    paymentOption,
  });
}

const COD_ITEM = { title: "GR Supra", paymentOptions: ["cod", "full"] };
const DELIVERY_ITEM = { title: "Veilside Supra", paymentOptions: ["deliveryOnly", "full"] };
const PARTIAL_ITEM = { title: "Supra A80", paymentOptions: ["partialAdvance", "full"], advancePaymentPercent: 50 };

describe("deriveCheckoutView — the four payment rules", () => {
  it("cod: COD allowed and default; nothing paid now, full total at the door", () => {
    const v = view({ products: [COD_ITEM], subtotal: 2000, shippingFee: 60, paymentMethod: "cod", paymentOption: "cod" });

    expect(v.rule).toBe("cod");
    expect(v.codAllowed).toBe(true);
    expect(v.payNow).toBe(0);
    expect(v.due).toBe(2060);
    expect(v.codSub).toBe("Pay ৳2,060 in cash when your order arrives");
    expect(v.banner.title).toBe("Cash on Delivery works for this whole order.");
    expect(v.cta.label).toBe("Place order · ৳2,060 due on delivery");
  });

  it("delivery: COD locked; the minimum is the shipping charge, remainder in cash", () => {
    const v = view({ products: [DELIVERY_ITEM], subtotal: 2000, shippingFee: 60, paymentMethod: "bkash", paymentOption: "deliveryOnly" });

    expect(v.rule).toBe("delivery");
    expect(v.codAllowed).toBe(false);
    expect(v.min).toBe(60); // = shipping
    expect(v.payNow).toBe(60);
    expect(v.due).toBe(2000);
    expect(v.selectorVisible).toBe(true); // deliveryOnly vs full
    expect(v.banner.title).toBe("One small step to confirm — prepay the delivery charge.");
    expect(v.banner.body).toContain("৳60 delivery charge lands");
    expect(v.banner.body).toContain("remaining ৳2,000");
    expect(v.codSub).toContain("Veilside Supra"); // names the triggering product
    expect(v.cta.label).toBe("Pay ৳60 & place order");
  });

  it("partial: minimum is the % advance of SUBTOTAL (not a flat amount)", () => {
    const v = view({ products: [PARTIAL_ITEM], subtotal: 2000, shippingFee: 60, paymentMethod: "bkash", paymentOption: "partialAdvance" });

    expect(v.rule).toBe("partial");
    expect(v.min).toBe(1000); // 50% of 2000 subtotal
    expect(v.payNow).toBe(1000);
    expect(v.due).toBe(1060);
    expect(v.selectorVisible).toBe(true);
    expect(v.banner.title).toBe("A ৳1,000 advance reserves your piece.");
    expect(v.banner.body).toContain("Supra A80 is an import pre-order");
    expect(v.plans.a).toEqual({ key: "partialAdvance", title: "Pay ৳1,000 now", sub: "৳1,060 in cash at your door" });
    expect(v.plans.b).toEqual({ key: "full", title: "Pay ৳2,060 now", sub: "Nothing to pay on delivery" });
  });

  it("partial → choosing 'full' pays everything now, nothing due", () => {
    const v = view({ products: [PARTIAL_ITEM], subtotal: 2000, shippingFee: 60, paymentMethod: "bkash", paymentOption: "full" });

    expect(v.payNow).toBe(2060);
    expect(v.due).toBe(0);
    expect(v.cta.sub).toBe("All settled — just receive and unbox.");
  });

  it("full: only 'full' survives the cart intersection — no selector, static note", () => {
    // deliveryOnly-item ∩ partialAdvance-item → neither cod/deliveryOnly/partialAdvance, only full.
    const v = view({ products: [DELIVERY_ITEM, PARTIAL_ITEM], subtotal: 2000, shippingFee: 60, paymentMethod: "bkash", paymentOption: "full" });

    expect(v.rule).toBe("full");
    expect(v.codAllowed).toBe(false);
    expect(v.min).toBe(2060); // = total
    expect(v.payNow).toBe(2060);
    expect(v.due).toBe(0);
    expect(v.selectorVisible).toBe(false);
    expect(v.staticNote).toBe("Full payment of ৳2,060 confirms this order — nothing due on delivery.");
  });

  it("zone-forced prepay: COD locked by the ZONE, so the reason names the zone, not a product", () => {
    const v = view({ products: [COD_ITEM], zoneRequiresPrepay: true, subtotal: 2000, shippingFee: 120, paymentMethod: "bkash", paymentOption: "deliveryOnly" });

    expect(v.codAllowed).toBe(false);
    expect(v.rule).toBe("delivery"); // zone force-offers deliveryOnly + full
    expect(v.min).toBe(120);
    expect(v.codSub).toContain("delivery zone"); // not a product name — no product disallowed COD
    expect(v.selectorVisible).toBe(true);
  });

  it("split bar: the 'pay now' segment never collapses below 4%", () => {
    const v = view({ products: [DELIVERY_ITEM], subtotal: 100000, shippingFee: 60, paymentMethod: "bkash", paymentOption: "deliveryOnly" });
    expect(v.barNowPct).toBe(4); // 60/100060 rounds to 0 → clamped
  });
});
