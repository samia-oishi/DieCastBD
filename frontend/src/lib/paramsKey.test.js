import { describe, it, expect } from "vitest";

import { paramsKey } from "./paramsKey";
import { HOME_PRODUCT_QUERIES } from "@/features/home/homeQueries";

// paramsKey is the contract between scripts/prerender.mjs (which bakes a
// homepage query's response under this key) and useProducts (which reads it
// back). A mismatch doesn't throw — it just silently misses, and the carousels
// quietly go back to loading late. These lock the shape down.
describe("paramsKey", () => {
  it("is order-independent, so params written in any order find their payload", () => {
    expect(paramsKey({ featured: true, limit: 4 })).toBe(paramsKey({ limit: 4, featured: true }));
  });

  it("drops empty values rather than minting a second key for the same query", () => {
    expect(paramsKey({ limit: 8, brand: undefined, category: null, q: "" })).toBe("limit=8");
  });

  it("distinguishes genuinely different queries", () => {
    const keys = Object.values(HOME_PRODUCT_QUERIES).map(paramsKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keeps false and 0, which are real filter values", () => {
    expect(paramsKey({ featured: false, page: 0 })).toBe("featured=false&page=0");
  });

  it("handles no params at all", () => {
    expect(paramsKey()).toBe("");
    expect(paramsKey({})).toBe("");
  });

  it("produces the exact keys the prerender writes for the homepage", () => {
    // Guards against a rename on either side of the bake.
    expect(paramsKey(HOME_PRODUCT_QUERIES.collectorPicks)).toBe("hero=true&limit=8");
    expect(paramsKey(HOME_PRODUCT_QUERIES.newArrivals)).toBe("limit=8&newArrival=true&sort=newest");
    expect(paramsKey(HOME_PRODUCT_QUERIES.featured)).toBe("featured=true&limit=4");
  });
});

describe("HOME_PRODUCT_QUERIES", () => {
  it("only holds plain serialisable params — they have to survive JSON in the HTML", () => {
    for (const [name, params] of Object.entries(HOME_PRODUCT_QUERIES)) {
      for (const [k, v] of Object.entries(params)) {
        expect(["string", "number", "boolean"], `${name}.${k}`).toContain(typeof v);
      }
    }
  });
});
