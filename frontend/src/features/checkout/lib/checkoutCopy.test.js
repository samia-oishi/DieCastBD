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
    expect(v.codSub).toBe("Pay the rider when your order arrives.");
    expect(v.banner.title).toBe("Cash on Delivery works for this order.");
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
    expect(v.banner.title).toBe("Prepay the delivery charge to confirm.");
    expect(v.banner.body).toBe("Pay it with bKash or BanglaQR. The rest is cash on delivery.");
    // The banner names the product; the locked-COD row only says why.
    expect(v.codSub).toBe("This order needs the delivery charge prepaid.");
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
    expect(v.banner.body).toContain("Supra A80 is a pre-order");
    expect(v.plans.a).toEqual({ key: "partialAdvance", title: "Pay ৳1,000 now", sub: "৳1,060 in cash at your door" });
    expect(v.plans.b).toEqual({ key: "full", title: "Pay ৳2,060 now", sub: "Nothing to pay on delivery" });
  });

  it("partial → choosing 'full' pays everything now, nothing due", () => {
    const v = view({ products: [PARTIAL_ITEM], subtotal: 2000, shippingFee: 60, paymentMethod: "bkash", paymentOption: "full" });

    expect(v.payNow).toBe(2060);
    expect(v.due).toBe(0);
    expect(v.cta.sub).toBe("Nothing left to pay on delivery.");
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
    expect(v.staticNote).toBe("You're paying in full — nothing due on delivery.");
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

  it("hides the banner on the COD happy path, shows it whenever COD is off the table", () => {
    // Most products offer COD, so a banner there would fire on nearly every order.
    const cod = view({ products: [COD_ITEM], subtotal: 2000, shippingFee: 60, paymentMethod: "cod", paymentOption: "cod" });
    expect(cod.bannerVisible).toBe(false);

    for (const products of [[DELIVERY_ITEM], [PARTIAL_ITEM], [DELIVERY_ITEM, PARTIAL_ITEM]]) {
      const v = view({ products, subtotal: 2000, shippingFee: 60, paymentMethod: "bkash", paymentOption: "full" });
      expect(v.bannerVisible).toBe(true);
    }

    // A zone that disables COD is "different" too, even for a COD-capable product.
    const zoned = view({ products: [COD_ITEM], zoneRequiresPrepay: true, subtotal: 2000, shippingFee: 120, paymentMethod: "bkash", paymentOption: "deliveryOnly" });
    expect(zoned.bannerVisible).toBe(true);
  });

  it("shows the Pay-now/Cash-on-delivery box only when the money is actually split", () => {
    // COD → "Pay now ৳0"; full prepayment → "Cash on delivery ৳0". Both are noise.
    const cod = view({ products: [COD_ITEM], subtotal: 2000, shippingFee: 60, paymentMethod: "cod", paymentOption: "cod" });
    const paidInFull = view({ products: [PARTIAL_ITEM], subtotal: 2000, shippingFee: 60, paymentMethod: "bkash", paymentOption: "full" });
    const split = view({ products: [PARTIAL_ITEM], subtotal: 2000, shippingFee: 60, paymentMethod: "bkash", paymentOption: "partialAdvance" });

    expect(cod.splitVisible).toBe(false); // payNow ৳0
    expect(paidInFull.splitVisible).toBe(false); // due ৳0
    expect(split.splitVisible).toBe(true); // ৳1,000 now + ৳1,060 at the door
  });

  it("banners carry the reason, not amounts already shown in the plan cards / split bar / summary", () => {
    // Every figure is on screen three times already. The one deliberate exception
    // is the partial-advance headline — that number is what customers scan for.
    const delivery = view({ products: [DELIVERY_ITEM], subtotal: 2000, shippingFee: 60, paymentMethod: "bkash", paymentOption: "deliveryOnly" });
    const partial = view({ products: [PARTIAL_ITEM], subtotal: 2000, shippingFee: 60, paymentMethod: "bkash", paymentOption: "partialAdvance" });

    expect(delivery.banner.title).not.toMatch(/৳/);
    expect(delivery.banner.body).not.toMatch(/৳/);
    expect(partial.banner.body).not.toMatch(/৳/);
    expect(partial.banner.title).toMatch(/৳/); // the exception

    for (const v of [delivery, partial]) {
      expect(v.banner.title.split(" ").length).toBeLessThanOrEqual(8);
      expect(v.banner.body.split(" ").length).toBeLessThanOrEqual(16);
      expect(v.codSub.split(" ").length).toBeLessThanOrEqual(10);
    }

    // The blocking product is named ONCE, in the banner — not again in the
    // locked-COD row two rows below it. Real titles run to 40+ characters.
    expect(partial.banner.body).toContain("Supra A80");
    expect(partial.codSub).not.toContain("Supra A80");
    expect(delivery.codSub).not.toContain("Veilside Supra");
  });
});
