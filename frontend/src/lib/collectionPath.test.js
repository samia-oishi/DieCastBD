import { describe, it, expect } from "vitest";
import { collectionPath } from "./collectionPath";

describe("collectionPath", () => {
  it("rewrites a single brand facet to its landing page", () => {
    expect(collectionPath("/shop?brand=mini-gt")).toBe("/brand/mini-gt");
  });

  it("rewrites a single category facet", () => {
    expect(collectionPath("/shop?category=accessories")).toBe("/category/accessories");
  });

  // Multi-facet views are app state, not indexable pages — rewriting them
  // would silently drop one of the filters the merchant linked to.
  it("leaves multi-facet URLs alone", () => {
    expect(collectionPath("/shop?brand=mini-gt&category=premium-singles")).toBe("/shop?brand=mini-gt&category=premium-singles");
    expect(collectionPath("/shop?brand=mini-gt&q=supra")).toBe("/shop?brand=mini-gt&q=supra");
  });

  it("leaves facets without a landing page alone", () => {
    expect(collectionPath("/shop?series=car-culture")).toBe("/shop?series=car-culture");
    expect(collectionPath("/shop?featured=true")).toBe("/shop?featured=true");
  });

  it("passes through plain and external URLs untouched", () => {
    expect(collectionPath("/shop")).toBe("/shop");
    expect(collectionPath("/about")).toBe("/about");
    expect(collectionPath("https://facebook.com/diecastbd")).toBe("https://facebook.com/diecastbd");
  });

  it("survives empty values and non-strings rather than throwing in the header", () => {
    expect(collectionPath("/shop?brand=")).toBe("/shop?brand=");
    expect(collectionPath(undefined)).toBe(undefined);
    expect(collectionPath(null)).toBe(null);
  });
});
