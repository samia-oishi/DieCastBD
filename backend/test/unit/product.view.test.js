import { describe, it, expect } from "vitest";
import { withComputedVirtuals, PUBLIC_CARD_FIELDS } from "../../src/modules/products/product.view.js";

describe("withComputedVirtuals", () => {
  it("computes availableStock from stock minus reservations", () => {
    expect(withComputedVirtuals({ stock: 10, reservedStock: 3 }).availableStock).toBe(7);
  });

  // Regression: the Pages block resolver leaned without this, so availableStock
  // was undefined — and `undefined <= 0` is false, so ProductCard treated an
  // out-of-stock product as buyable and rendered an add-to-cart button.
  it("returns 0 (not undefined) when everything is reserved", () => {
    const p = withComputedVirtuals({ stock: 4, reservedStock: 4 });
    expect(p.availableStock).toBe(0);
    expect(p.availableStock <= 0).toBe(true);
  });

  it("marks a pre-order active only while it is undated or unexpired", () => {
    const future = new Date(Date.now() + 86400000);
    const past = new Date(Date.now() - 86400000);
    expect(withComputedVirtuals({ isPreOrder: true }).isPreOrderActive).toBe(true);
    expect(withComputedVirtuals({ isPreOrder: true, preOrderEndDate: future }).isPreOrderActive).toBe(true);
    expect(withComputedVirtuals({ isPreOrder: true, preOrderEndDate: past }).isPreOrderActive).toBe(false);
    expect(withComputedVirtuals({ isPreOrder: false }).isPreOrderActive).toBe(false);
  });

  it("leaves profitMargin null when costPrice isn't selected (every public route)", () => {
    expect(withComputedVirtuals({ stock: 1, reservedStock: 0, price: 500 }).profitMargin).toBeNull();
  });

  it("computes profitMargin off the effective (sale) price when cost is present", () => {
    const p = withComputedVirtuals({ stock: 1, reservedStock: 0, price: 1000, salePrice: 800, costPrice: 400 });
    expect(p.profitMargin).toBe(50);
  });

  it("selects every field a product card reads", () => {
    for (const field of ["slug", "title", "brand", "price", "salePrice", "thumbnail", "gallery", "isNewArrival", "stock", "reservedStock", "isPreOrder", "preOrderEndDate"]) {
      expect(PUBLIC_CARD_FIELDS).toContain(field);
    }
  });
});
