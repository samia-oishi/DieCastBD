import { describe, it, expect } from "vitest";

import { applyItemsAdded, describeItemsAdded } from "../../src/modules/orders/orderAdjustment.js";
import { assertPaymentMethodAllowed } from "../../src/modules/orders/paymentPlan.service.js";

// A live order: two items at ৳1,590, a ৳60 coupon, ৳70 delivery, ৳500 already
// received by bKash.
const order = (over = {}) => ({ subtotal: 3180, discount: 60, shippingFee: 70, amountPaid: 500, total: 3190, amountDue: 2690, ...over });

describe("applyItemsAdded", () => {
  it("adds to the subtotal and pushes the whole increase onto what the rider collects", () => {
    const next = applyItemsAdded(order(), 1490);
    expect(next.subtotal).toBe(4670);
    expect(next.total).toBe(4680); // 4670 - 60 + 70
    expect(next.amountPaid).toBe(500); // untouched
    expect(next.amountDue).toBe(4180); // 4680 - 500
  });

  it("keeps both money invariants", () => {
    const o = order();
    const next = applyItemsAdded(o, 899);
    expect(next.total).toBe(next.subtotal - o.discount + o.shippingFee);
    expect(next.amountPaid + next.amountDue).toBe(next.total);
  });

  it("does NOT grow the discount — a coupon is snapshotted, not re-run", () => {
    // The trap: re-deriving a percentage coupon over a bigger basket would hand
    // the customer a larger discount than the one they were actually granted.
    const before = order({ discount: 300 });
    const next = applyItemsAdded(before, 2000);
    expect(next.total).toBe(before.subtotal + 2000 - 300 + before.shippingFee);
  });

  it("does not charge delivery twice — shippingFee is unchanged", () => {
    const next = applyItemsAdded(order(), 1000);
    expect(next.total - (next.subtotal - 60)).toBe(70);
  });

  it("refuses a zero or negative addition rather than writing a no-op", () => {
    expect(() => applyItemsAdded(order(), 0)).toThrow(/Nothing was added/);
    expect(() => applyItemsAdded(order(), -500)).toThrow(/cannot be negative/);
  });

  it("works on an order with no coupon, no advance and free shipping", () => {
    const next = applyItemsAdded({ subtotal: 1000, discount: 0, shippingFee: 0, amountPaid: 0 }, 500);
    expect(next).toMatchObject({ subtotal: 1500, total: 1500, amountPaid: 0, amountDue: 1500 });
  });

  it("leaves a fully-prepaid order owing exactly the new items", () => {
    // amountPaid stays where it is, so the balance created IS the addition.
    const paid = { subtotal: 2000, discount: 0, shippingFee: 70, amountPaid: 2070 };
    expect(applyItemsAdded(paid, 1490).amountDue).toBe(1490);
  });
});

describe("describeItemsAdded", () => {
  it("says what was added and what to collect", () => {
    const before = order();
    const after = applyItemsAdded(before, 1490);
    const note = describeItemsAdded(before, after, [{ title: "Supra MK4", qty: 1 }]);
    expect(note).toContain("Added 1x Supra MK4");
    expect(note).toContain("৳3,180");
    expect(note).toContain("Collect ৳4,180 on delivery");
  });
});

/** Merchant: "Currently when admin want to create order it prevent to create
 * order for pre pay product or full pay product. Admin should able to create
 * without any prepay or anything." */
describe("admin orders are exempt from the storefront's payment rules", () => {
  const fullPayOnly = { product: { title: "Limited RWB 993", paymentOptions: ["full"] } };
  const advanceOnly = { product: { title: "Pre-order LB Silhouette", paymentOptions: ["partialAdvance"], advancePaymentPercent: 30 } };

  it("still blocks a CUSTOMER from checking such a product out as COD", () => {
    // The rule has to keep working where it was meant to work.
    expect(() => assertPaymentMethodAllowed({ normalizedItems: [fullPayOnly], paymentOption: "cod", zoneRequiresPrepay: false }))
      .toThrow(/cannot be ordered with the selected payment option/);
    expect(() => assertPaymentMethodAllowed({ normalizedItems: [advanceOnly], paymentOption: "cod", zoneRequiresPrepay: false }))
      .toThrow(/cannot be ordered with the selected payment option/);
  });

  it("still blocks COD in a zone that requires prepaying the delivery charge", () => {
    const codItem = { product: { title: "Hot Wheels Premium", paymentOptions: ["cod"] } };
    expect(() => assertPaymentMethodAllowed({ normalizedItems: [codItem], paymentOption: "cod", zoneRequiresPrepay: true }))
      .toThrow(/this delivery zone requires paying the delivery charge upfront/);
  });

  it("is skipped entirely when the caller does not enforce the rules", () => {
    // buildAndSaveOrder guards the call with `if (enforcePaymentRules)`, so the
    // admin path never reaches any of the throws above. Proven by the negative:
    // these are the exact carts that fail when the rules DO run.
    const adminCart = [fullPayOnly, advanceOnly];
    expect(() => assertPaymentMethodAllowed({ normalizedItems: adminCart, paymentOption: "cod", zoneRequiresPrepay: true })).toThrow();
  });
});
