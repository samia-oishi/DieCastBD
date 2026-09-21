import { describe, it, expect } from "vitest";
import { asFilterOptions, asShelfTiles, asLinkableCollections } from "./collectionVisibility";

// Not a real redirected slug — "premium-singles" is in REDIRECTED_SLUGS and would
// be excluded for a different reason than the one under test.
const stocked = { slug: "premium-singles", isActive: true, activeProductCount: 12 };
const paused = { slug: "paused", isActive: false, activeProductCount: 4 };
const soldOut = { slug: "sold-out", isActive: true, activeProductCount: 0 };
const legacy = { slug: "legacy", isActive: true }; // older backend: no count field

describe("collection visibility", () => {
  describe("asFilterOptions", () => {
    it("drops what the merchant switched off", () => {
      expect(asFilterOptions([stocked, paused]).map((c) => c.slug)).toEqual(["premium-singles"]);
    });

    it("keeps a switched-on collection that is temporarily out of stock — the switch is the merchant's, and nothing else overrides it", () => {
      expect(asFilterOptions([soldOut]).map((c) => c.slug)).toEqual(["sold-out"]);
    });
  });

  describe("asShelfTiles", () => {
    it("shows only collections that are switched on AND have something to buy", () => {
      expect(asShelfTiles([stocked, paused, soldOut]).map((c) => c.slug)).toEqual(["premium-singles"]);
    });
  });

  describe("asLinkableCollections", () => {
    it("links stocked collections even when they are hidden from the shop filter", () => {
      expect(asLinkableCollections([stocked, paused, soldOut]).map((c) => c.slug)).toEqual([
        "premium-singles",
        "paused",
      ]);
    });
  });

  // The two apps deploy separately; a frontend running ahead of the backend
  // gets no activeProductCount at all. Reading that as "empty" would blank the
  // homepage shelf and the entire /collections hub on a fully stocked shop.
  it("treats a missing count as unknown, not as zero", () => {
    expect(asShelfTiles([legacy])).toHaveLength(1);
    expect(asLinkableCollections([legacy])).toHaveLength(1);
  });

  it("survives an undefined list", () => {
    expect(asFilterOptions(undefined)).toEqual([]);
    expect(asShelfTiles(undefined)).toEqual([]);
    expect(asLinkableCollections(undefined)).toEqual([]);
  });
});
