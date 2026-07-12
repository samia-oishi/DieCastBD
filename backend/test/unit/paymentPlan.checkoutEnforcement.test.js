import { describe, it, expect } from "vitest";
import { assertPaymentMethodAllowed, calculateAmountPaid } from "../../src/modules/orders/paymentPlan.service.js";

// Phase 4 checkout-enforcement math — assertPaymentMethodAllowed/calculateAmountPaid
// are the only new logic inserted into buildAndSaveOrder (order.service.js); the
// stock-bucket state machine itself is untouched (see order.stockBucket.test.js).
// Table-driven coverage here is the regression guard for that additive wiring.

const codFullProduct = { title: "Standard Model", paymentOptions: ["cod", "full"] };
const codOnlyProduct = { title: "COD-only Model", paymentOptions: ["cod"] };
const deliveryOnlyProduct = { title: "Delivery-only Model", paymentOptions: ["deliveryOnly"] };
const advance10Product = { title: "10% Advance Model", paymentOptions: ["partialAdvance", "full"], advancePaymentPercent: 10 };
const advance25Product = { title: "25% Advance Model", paymentOptions: ["partialAdvance"], advancePaymentPercent: 25 };

describe("assertPaymentMethodAllowed", () => {
  it("allows pure cod against a cod+full product", () => {
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: codFullProduct }],
        paymentOption: "cod",
        zoneRequiresPrepay: false,
      })
    ).not.toThrow();
  });

  it("allows pure full payment against any product", () => {
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: codFullProduct }, { product: advance10Product }],
        paymentOption: "full",
        zoneRequiresPrepay: false,
      })
    ).not.toThrow();
  });

  it("allows deliveryOnly against a product configured for it", () => {
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: deliveryOnlyProduct }],
        paymentOption: "deliveryOnly",
        zoneRequiresPrepay: false,
      })
    ).not.toThrow();
  });

  it("allows partialAdvance-only cart", () => {
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: advance10Product }],
        paymentOption: "partialAdvance",
        zoneRequiresPrepay: false,
      })
    ).not.toThrow();
  });

  it("rejects cod against a deliveryOnly-only product", () => {
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: deliveryOnlyProduct }],
        paymentOption: "cod",
        zoneRequiresPrepay: false,
      })
    ).toThrow(/cannot be ordered/);
  });

  it("rejects a mixed cart: partialAdvance-required item with cod selected", () => {
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: codFullProduct }, { product: advance25Product }],
        paymentOption: "cod",
        zoneRequiresPrepay: false,
      })
    ).toThrow(/cannot be ordered/);
  });

  it("rejects a mixed cart: cod-only item with partialAdvance selected", () => {
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: codOnlyProduct }, { product: advance25Product }],
        paymentOption: "partialAdvance",
        zoneRequiresPrepay: false,
      })
    ).toThrow(/cannot be ordered/);
  });

  // zoneRequiresPrepay is a SAFETY NET, not a blanket override: it only kicks
  // in for an item that is itself cod-only (no deliveryOnly/partialAdvance/
  // full configured). A product that already offers one of those alternatives
  // — including the default cod+full — is trusted to have its own payment
  // risk handled, so the zone must NOT block its COD or force it onto
  // "deliveryOnly".

  it("rejects cod for a cod-only product when the zone forces prepay", () => {
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: codOnlyProduct }],
        paymentOption: "cod",
        zoneRequiresPrepay: true,
      })
    ).toThrow(/requires paying the delivery charge upfront/);
  });

  it("allows deliveryOnly for a cod-only product when the zone forces prepay, even though the product never opted into deliveryOnly itself", () => {
    // Regression guard: a zone-forced prepay must be satisfiable by paying just
    // the delivery charge, even though the product's own paymentOptions don't
    // list "deliveryOnly".
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: codOnlyProduct }],
        paymentOption: "deliveryOnly",
        zoneRequiresPrepay: true,
      })
    ).not.toThrow();
  });

  it("also allows full payment for a cod-only product when the zone forces prepay — the customer gets a choice of delivery-charge-only OR full upfront, not delivery-only alone", () => {
    // The zone force offers BOTH prepay alternatives (deliveryOnly + full) for
    // an item the merchant configured as cod-only, so the customer can choose
    // to fully prepay instead of only the delivery charge.
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: codOnlyProduct }],
        paymentOption: "full",
        zoneRequiresPrepay: true,
      })
    ).not.toThrow();
  });

  it("still rejects full for a cod-only product when the zone does NOT force prepay — the product itself never opted into full payment", () => {
    // Guards against over-widening: without the zone force, a cod-only product
    // has no "full" option of its own, so full must still be rejected.
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: codOnlyProduct }],
        paymentOption: "full",
        zoneRequiresPrepay: false,
      })
    ).toThrow(/cannot be ordered/);
  });

  it("still allows cod for a cod-only product when the zone does NOT force prepay", () => {
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: codOnlyProduct }],
        paymentOption: "cod",
        zoneRequiresPrepay: false,
      })
    ).not.toThrow();
  });

  it("allows cod for a cod+full product even when the zone forces prepay — the product's own full-payment alternative means the zone doesn't need to force anything", () => {
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: codFullProduct }],
        paymentOption: "cod",
        zoneRequiresPrepay: true,
      })
    ).not.toThrow();
  });

  it("still rejects deliveryOnly for a cod+full product even when the zone forces prepay — the force only applies to cod-only items", () => {
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: codFullProduct }],
        paymentOption: "deliveryOnly",
        zoneRequiresPrepay: true,
      })
    ).toThrow(/cannot be ordered/);
  });

  it("rejects deliveryOnly for a cod+full product when the zone does NOT force prepay either", () => {
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: codFullProduct }],
        paymentOption: "deliveryOnly",
        zoneRequiresPrepay: false,
      })
    ).toThrow(/cannot be ordered/);
  });

  it("allows full payment even when the zone forces prepay", () => {
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: codFullProduct }],
        paymentOption: "full",
        zoneRequiresPrepay: true,
      })
    ).not.toThrow();
  });

  it("rejects a mixed cart where one item is cod-only in a prepay zone and cod is selected, even though another item allows cod+full", () => {
    expect(() =>
      assertPaymentMethodAllowed({
        normalizedItems: [{ product: codFullProduct }, { product: codOnlyProduct }],
        paymentOption: "cod",
        zoneRequiresPrepay: true,
      })
    ).toThrow(/requires paying the delivery charge upfront/);
  });
});

describe("calculateAmountPaid", () => {
  it("full: collects the entire total upfront", () => {
    const result = calculateAmountPaid({
      normalizedItems: [{ product: codFullProduct }],
      subtotal: 1000,
      total: 1100,
      shippingFee: 100,
      paymentOption: "full",
    });
    expect(result).toEqual({ amountPaid: 1100, amountDue: 0, advancePaymentPercent: null });
  });

  it("cod: nothing collected upfront", () => {
    const result = calculateAmountPaid({
      normalizedItems: [{ product: codFullProduct }],
      subtotal: 1000,
      total: 1100,
      shippingFee: 100,
      paymentOption: "cod",
    });
    expect(result).toEqual({ amountPaid: 0, amountDue: 1100, advancePaymentPercent: null });
  });

  it("deliveryOnly: collects exactly the shipping fee", () => {
    const result = calculateAmountPaid({
      normalizedItems: [{ product: deliveryOnlyProduct }],
      subtotal: 1000,
      total: 1100,
      shippingFee: 100,
      paymentOption: "deliveryOnly",
    });
    expect(result).toEqual({ amountPaid: 100, amountDue: 1000, advancePaymentPercent: null });
  });

  it("partialAdvance: collects the configured percent of subtotal", () => {
    const result = calculateAmountPaid({
      normalizedItems: [{ product: advance10Product }],
      subtotal: 1000,
      total: 1100,
      shippingFee: 100,
      paymentOption: "partialAdvance",
    });
    expect(result).toEqual({ amountPaid: 100, amountDue: 1000, advancePaymentPercent: 10 });
  });

  it("partialAdvance: takes the MAX percent across multiple differently-configured items", () => {
    const result = calculateAmountPaid({
      normalizedItems: [{ product: advance10Product }, { product: advance25Product }],
      subtotal: 1000,
      total: 1100,
      shippingFee: 100,
      paymentOption: "partialAdvance",
    });
    expect(result.advancePaymentPercent).toBe(25);
    expect(result.amountPaid).toBe(250);
    expect(result.amountDue).toBe(850);
  });

  it("never lets amountPaid exceed total, even with a high advance percent and small shipping fee", () => {
    const result = calculateAmountPaid({
      normalizedItems: [{ product: { title: "x", paymentOptions: ["partialAdvance"], advancePaymentPercent: 100 } }],
      subtotal: 1000,
      total: 950, // e.g. a discount larger than the shipping fee
      shippingFee: 0,
      paymentOption: "partialAdvance",
    });
    expect(result.amountPaid).toBeLessThanOrEqual(950);
    expect(result.amountDue).toBeGreaterThanOrEqual(0);
  });
});
