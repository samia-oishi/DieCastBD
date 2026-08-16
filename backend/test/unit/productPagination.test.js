import { describe, it, expect } from "vitest";

import { partitionPage } from "../../src/modules/products/product.pagination.js";

/** Walks every page the way the shop's infinite scroll does, and reconstructs
 * the full list from the slices. This is the property that actually matters:
 * every product appears exactly once, in the right half, with sold-out last. */
function walk({ availableTotal, soldOutTotal, limit }) {
  const total = availableTotal + soldOutTotal;
  const out = [];
  for (let skip = 0; skip < total; skip += limit) {
    const { availableSkip, fromAvailable, soldOutSkip, fromSoldOut } = partitionPage({ skip, limit, availableTotal });
    for (let i = 0; i < fromAvailable && availableSkip + i < availableTotal; i += 1) out.push(`A${availableSkip + i}`);
    for (let i = 0; i < fromSoldOut && soldOutSkip + i < soldOutTotal; i += 1) out.push(`S${soldOutSkip + i}`);
  }
  return out;
}

describe("partitionPage", () => {
  it("serves a page wholly inside the in-stock run from that half alone", () => {
    expect(partitionPage({ skip: 0, limit: 10, availableTotal: 30 })).toEqual({
      availableSkip: 0, fromAvailable: 10, soldOutSkip: 0, fromSoldOut: 0,
    });
  });

  it("fills the straddling page from the tail of one half and the head of the other", () => {
    // 30 in stock, page size 4 → page 8 covers 28..31: two in stock, two sold out.
    expect(partitionPage({ skip: 28, limit: 4, availableTotal: 30 })).toEqual({
      availableSkip: 28, fromAvailable: 2, soldOutSkip: 0, fromSoldOut: 2,
    });
  });

  it("serves pages past the boundary from the sold-out half, correctly offset", () => {
    expect(partitionPage({ skip: 32, limit: 4, availableTotal: 30 })).toEqual({
      availableSkip: 0, fromAvailable: 0, soldOutSkip: 2, fromSoldOut: 4,
    });
  });

  it("handles a catalogue with nothing in stock", () => {
    expect(partitionPage({ skip: 0, limit: 10, availableTotal: 0 })).toEqual({
      availableSkip: 0, fromAvailable: 0, soldOutSkip: 0, fromSoldOut: 10,
    });
  });

  it("handles a catalogue with nothing sold out", () => {
    const p = partitionPage({ skip: 0, limit: 10, availableTotal: 50 });
    expect(p.fromAvailable).toBe(10);
    expect(p.fromSoldOut).toBe(0);
  });

  // The regression that matters: paging the whole catalogue must reproduce every
  // product exactly once. A silent off-by-one here duplicates or drops one.
  it.each([
    [30, 2, 4],
    [30, 2, 10],
    [30, 2, 24],
    [30, 2, 7], // page size that divides neither half
    [1, 1, 1],
    [0, 5, 3], // everything sold out
    [5, 0, 3], // nothing sold out
    [13, 9, 5],
    [100, 1, 24],
    [1, 100, 24],
  ])("pages cleanly over %i in stock + %i sold out at limit %i", (availableTotal, soldOutTotal, limit) => {
    const walked = walk({ availableTotal, soldOutTotal, limit });
    const expected = [
      ...Array.from({ length: availableTotal }, (_, i) => `A${i}`),
      ...Array.from({ length: soldOutTotal }, (_, i) => `S${i}`),
    ];
    expect(walked).toHaveLength(availableTotal + soldOutTotal);
    expect(new Set(walked).size).toBe(walked.length); // no duplicates
    expect(walked).toEqual(expected); // right order: every in-stock item before every sold-out one
  });
});
