import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/** bakedData memoises on first read, so each case needs a fresh module. */
async function loadWith(json) {
  vi.resetModules();
  document.getElementById("__HOME_DATA__")?.remove();
  if (json !== undefined) {
    const el = document.createElement("script");
    el.type = "application/json";
    el.id = "__HOME_DATA__";
    el.textContent = json;
    document.head.appendChild(el);
  }
  return import("./bakedData");
}

beforeEach(() => vi.resetModules());
afterEach(() => document.getElementById("__HOME_DATA__")?.remove());

describe("bakedData", () => {
  it("reads the payload the prerender wrote", async () => {
    const { bakedProductList, bakedBrands, bakedCategories } = await loadWith(
      JSON.stringify({
        products: { "hero=true&limit=8": { data: [{ _id: "1", title: "Supra" }], meta: { total: 5 } } },
        brands: [{ slug: "hot-wheels" }],
        categories: [{ slug: "premium" }],
      })
    );
    expect(bakedProductList("hero=true&limit=8").data[0].title).toBe("Supra");
    expect(bakedProductList("hero=true&limit=8").meta.total).toBe(5);
    expect(bakedBrands()).toHaveLength(1);
    expect(bakedCategories()).toHaveLength(1);
  });

  it("returns undefined for a query that wasn't baked, so other pages behave as before", async () => {
    const { bakedProductList } = await loadWith(JSON.stringify({ products: { "hero=true&limit=8": { data: [] } } }));
    expect(bakedProductList("brand=mini-gt&limit=24")).toBeUndefined();
  });

  it("returns undefined everywhere when there is no payload — dev and every non-home route", async () => {
    const { bakedProductList, bakedBrands, bakedCategories } = await loadWith(undefined);
    expect(bakedProductList("hero=true&limit=8")).toBeUndefined();
    expect(bakedBrands()).toBeUndefined();
    expect(bakedCategories()).toBeUndefined();
  });

  it("survives a malformed payload rather than breaking boot", async () => {
    // A truncated or corrupted blob must degrade to a normal client fetch, not
    // throw during the first render and take the whole homepage down.
    const { bakedProductList, bakedBrands } = await loadWith('{"products": {"a":');
    expect(bakedProductList("a")).toBeUndefined();
    expect(bakedBrands()).toBeUndefined();
  });

  it("tolerates a payload missing whole sections", async () => {
    const { bakedProductList, bakedBrands } = await loadWith(JSON.stringify({ brands: [{ slug: "x" }] }));
    expect(bakedProductList("anything")).toBeUndefined();
    expect(bakedBrands()).toHaveLength(1);
  });
});
