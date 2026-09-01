import { describe, it, expect } from "vitest";

import { applyOrderAdjustment, describeAdjustment } from "../../src/modules/orders/orderAdjustment.js";

// A plain COD order: 1,960 of goods + 70 delivery, nothing paid yet.
const order = (over = {}) => ({ subtotal: 1960, shippingFee: 70, discount: 0, total: 2030, amountPaid: 0, amountDue: 2030, ...over });

const invariants = (o, r) => {
  expect(r.total, "total = subtotal - discount + shipping").toBe(o.subtotal - r.discount + o.shippingFee);
  expect(r.amountPaid + r.amountDue, "amountPaid + amountDue = total").toBe(r.total);
};

describe("recording an advance payment", () => {
  it("moves money from due to paid without changing the total", () => {
    const o = order();
    const r = applyOrderAdjustment(o, { advanceReceived: 500 });
    expect(r.amountPaid).toBe(500);
    expect(r.amountDue).toBe(1530); // what the rider now collects
    expect(r.total).toBe(2030);
    invariants(o, r);
  });

  it("settles the order when the full amount is paid up front", () => {
    const r = applyOrderAdjustment(order(), { advanceReceived: 2030 });
    expect(r.amountDue).toBe(0);
  });

  it("refuses an advance larger than the total rather than clamping it", () => {
    // Silently clamping would leave a mistyped order looking settled.
    expect(() => applyOrderAdjustment(order(), { advanceReceived: 5000 })).toThrow(/more than/);
  });

  it("refuses negative or non-numeric input", () => {
    expect(() => applyOrderAdjustment(order(), { advanceReceived: -1 })).toThrow(/negative/);
    expect(() => applyOrderAdjustment(order(), { advanceReceived: "500" })).toThrow(/must be a number/);
    expect(() => applyOrderAdjustment(order(), { advanceReceived: NaN })).toThrow(/must be a number/);
  });
});

describe("applying a discount", () => {
  it("lowers the total and therefore what the rider collects", () => {
    const o = order();
    const r = applyOrderAdjustment(o, { discount: 200 });
    expect(r.total).toBe(1830);
    expect(r.amountDue).toBe(1830);
    invariants(o, r);
  });

  it("never touches the subtotal or the delivery charge", () => {
    const o = order();
    const r = applyOrderAdjustment(o, { discount: 200 });
    // An adjustment is about money, not about rewriting what was ordered.
    expect(r).not.toHaveProperty("subtotal");
    expect(r.total).toBe(o.subtotal - 200 + o.shippingFee);
  });

  it("refuses a discount larger than the goods", () => {
    expect(() => applyOrderAdjustment(order(), { discount: 3000 })).toThrow(/exceed/);
  });

  it("allows discounting the goods to zero, delivery still payable", () => {
    const o = order();
    const r = applyOrderAdjustment(o, { discount: 1960 });
    expect(r.total).toBe(70);
    invariants(o, r);
  });
});

describe("both at once — the Messenger case", () => {
  it("applies the discount, then the advance, and leaves the rest to collect", () => {
    const o = order();
    const r = applyOrderAdjustment(o, { discount: 200, advanceReceived: 500 });
    expect(r.total).toBe(1830);
    expect(r.amountPaid).toBe(500);
    expect(r.amountDue).toBe(1330);
    invariants(o, r);
  });

  it("re-checks the advance against the NEW total, not the old one", () => {
    // 1,900 was fine before a 200 discount and is too much after it. Validating
    // against the stale total would leave amountDue negative.
    expect(() => applyOrderAdjustment(order(), { discount: 200, advanceReceived: 1900 })).toThrow(/more than/);
  });

  it("keeps an existing advance consistent when only the discount changes", () => {
    const o = order({ amountPaid: 500, amountDue: 1530 });
    const r = applyOrderAdjustment(o, { discount: 200 });
    expect(r.amountPaid).toBe(500);
    expect(r.amountDue).toBe(1330);
    invariants(o, r);
  });

  it("leaves everything alone when nothing is passed", () => {
    const o = order({ discount: 60, total: 1970, amountPaid: 100, amountDue: 1870 });
    expect(applyOrderAdjustment(o, {})).toEqual({ discount: 60, total: 1970, amountPaid: 100, amountDue: 1870 });
  });
});

describe("describeAdjustment", () => {
  it("says what moved and what the rider now collects", () => {
    const before = order();
    const after = applyOrderAdjustment(before, { advanceReceived: 500 });
    expect(describeAdjustment(before, after)).toBe(
      "Payment adjusted: advance received ৳0 → ৳500. Collect ৳1,530 on delivery"
    );
  });

  it("includes the reason when one is given", () => {
    const before = order();
    const after = applyOrderAdjustment(before, { discount: 200 });
    expect(describeAdjustment(before, after, "Messenger deal")).toMatch(/Reason: Messenger deal$/);
  });

  it("returns null when nothing changed, so no misleading history entry is written", () => {
    const before = order();
    expect(describeAdjustment(before, applyOrderAdjustment(before, {}))).toBeNull();
  });
});
