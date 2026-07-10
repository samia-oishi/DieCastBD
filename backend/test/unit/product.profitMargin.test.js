import { describe, it, expect } from "vitest";
import { Product } from "../../src/modules/products/product.model.js";

// profitMargin is derived from list price, not salePrice — a catalog-level
// profitability metric, not a live "what am I earning right now" figure.
describe("Product.profitMargin virtual", () => {
  it("computes and rounds a percentage margin", () => {
    // (1000 - 600) / 1000 = 40%
    const product = new Product({ sku: "T-1", slug: "t-1", title: "Test", brand: "000000000000000000000000", price: 1000, costPrice: 600, stock: 1 });
    expect(product.profitMargin).toBe(40);
  });

  it("rounds to the nearest whole percent", () => {
    // (1000 - 675) / 1000 = 32.5% -> 33 (banker's rounding is not in play here, Math.round(32.5) === 33)
    const product = new Product({ sku: "T-2", slug: "t-2", title: "Test", brand: "000000000000000000000000", price: 1000, costPrice: 675, stock: 1 });
    expect(product.profitMargin).toBe(33);
  });

  it("is null when costPrice is unset", () => {
    const product = new Product({ sku: "T-3", slug: "t-3", title: "Test", brand: "000000000000000000000000", price: 1000, stock: 1 });
    expect(product.profitMargin).toBeNull();
  });

  it("is null rather than dividing by zero when price is 0", () => {
    const product = new Product({ sku: "T-4", slug: "t-4", title: "Test", brand: "000000000000000000000000", price: 0, costPrice: 0, stock: 1 });
    expect(product.profitMargin).toBeNull();
  });

  it("can be negative when cost exceeds price", () => {
    // (1000 - 1200) / 1000 = -20%
    const product = new Product({ sku: "T-5", slug: "t-5", title: "Test", brand: "000000000000000000000000", price: 1000, costPrice: 1200, stock: 1 });
    expect(product.profitMargin).toBe(-20);
  });
});
