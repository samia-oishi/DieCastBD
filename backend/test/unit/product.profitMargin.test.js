import { describe, it, expect } from "vitest";
import { Product } from "../../src/modules/products/product.model.js";

// profitMargin is derived from the *effective* selling price — salePrice when
// one is active, otherwise list price — so a discounted item's margin reflects
// what it's actually selling for right now.
describe("Product.profitMargin virtual", () => {
  it("computes and rounds a percentage margin off list price when not on sale", () => {
    // (1000 - 600) / 1000 = 40%
    const product = new Product({ sku: "T-1", slug: "t-1", title: "Test", brand: "000000000000000000000000", price: 1000, costPrice: 600, stock: 1 });
    expect(product.profitMargin).toBe(40);
  });

  it("computes margin off salePrice when the item is on sale", () => {
    // (800 - 600) / 800 = 25%, not the 40% it'd be off the ৳1000 list price
    const product = new Product({ sku: "T-1B", slug: "t-1b", title: "Test", brand: "000000000000000000000000", price: 1000, salePrice: 800, costPrice: 600, stock: 1 });
    expect(product.profitMargin).toBe(25);
  });

  it("ignores a salePrice that isn't actually a discount", () => {
    // salePrice >= price is not a real sale — falls back to list price, same as onSale checks elsewhere
    const product = new Product({ sku: "T-1C", slug: "t-1c", title: "Test", brand: "000000000000000000000000", price: 1000, salePrice: 1000, costPrice: 600, stock: 1 });
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
