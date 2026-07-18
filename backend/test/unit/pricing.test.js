import { describe, it, expect } from "vitest";
import { effectivePrice, isOnSale } from "../../src/utils/pricing.js";

// Regression guard for a REAL production bug: two active products were stored
// with salePrice: 0, and every price path used either `salePrice ?? price`
// (0 ?? 200 === 0) or `salePrice != null && salePrice < price` (0 != null is
// true) — so both would have been sold for ৳0.
describe("effectivePrice", () => {
  it("charges list price when there is no sale price", () => {
    expect(effectivePrice({ price: 200, salePrice: null })).toBe(200);
    expect(effectivePrice({ price: 200 })).toBe(200);
    expect(effectivePrice({ price: 200, salePrice: undefined })).toBe(200);
  });

  it("NEVER treats a zero sale price as free — the bug this rule exists for", () => {
    expect(effectivePrice({ price: 200, salePrice: 0 })).toBe(200);
    expect(effectivePrice({ price: 2390, salePrice: 0 })).toBe(2390);
    expect(isOnSale({ price: 200, salePrice: 0 })).toBe(false);
  });

  it("uses a genuine discount below list price", () => {
    expect(effectivePrice({ price: 200, salePrice: 150 })).toBe(150);
    expect(isOnSale({ price: 200, salePrice: 150 })).toBe(true);
  });

  it("ignores a 'sale' at or above list price", () => {
    expect(effectivePrice({ price: 200, salePrice: 200 })).toBe(200);
    expect(effectivePrice({ price: 200, salePrice: 250 })).toBe(200);
    expect(isOnSale({ price: 200, salePrice: 250 })).toBe(false);
  });

  it("is safe on missing input", () => {
    expect(effectivePrice(null)).toBe(0);
    expect(isOnSale(null)).toBe(false);
  });
});
