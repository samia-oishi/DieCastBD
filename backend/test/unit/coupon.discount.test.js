import { describe, it, expect } from "vitest";
import { calculateDiscount } from "../../src/modules/coupons/coupon.service.js";

// This is the single source of discount truth shared by the /coupons/validate
// preview and authoritative order creation — a drift here is a real money bug,
// so it gets the most thorough coverage in the suite.
describe("calculateDiscount", () => {
  it("computes a percentage discount", () => {
    const coupon = { type: "percentage", value: 10, minOrderValue: 0, maxDiscount: null };
    expect(calculateDiscount(coupon, 1000)).toBe(100);
  });

  it("computes a fixed discount", () => {
    const coupon = { type: "fixed", value: 500, minOrderValue: 0, maxDiscount: null };
    expect(calculateDiscount(coupon, 3000)).toBe(500);
  });

  it("caps a percentage discount at maxDiscount", () => {
    // 50% of 2000 = 1000, but the coupon caps the taka value at 500
    const coupon = { type: "percentage", value: 50, minOrderValue: 0, maxDiscount: 500 };
    expect(calculateDiscount(coupon, 2000)).toBe(500);
  });

  it("never lets the discount exceed the subtotal", () => {
    // A ৳500 fixed coupon on a ৳300 order discounts only ৳300, never turns negative
    const coupon = { type: "fixed", value: 500, minOrderValue: 0, maxDiscount: null };
    expect(calculateDiscount(coupon, 300)).toBe(300);
  });

  it("rounds to a whole taka", () => {
    // 10% of 1055 = 105.5 -> 106
    const coupon = { type: "percentage", value: 10, minOrderValue: 0, maxDiscount: null };
    expect(calculateDiscount(coupon, 1055)).toBe(106);
  });

  it("throws when the subtotal is below minOrderValue", () => {
    const coupon = { type: "fixed", value: 500, minOrderValue: 3000, maxDiscount: null };
    expect(() => calculateDiscount(coupon, 2999)).toThrow(/minimum order/i);
  });

  it("allows an order that exactly meets minOrderValue", () => {
    const coupon = { type: "fixed", value: 500, minOrderValue: 3000, maxDiscount: null };
    expect(calculateDiscount(coupon, 3000)).toBe(500);
  });
});
