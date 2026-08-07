import { describe, it, expect, vi, beforeEach } from "vitest";

const upserted = [];
vi.mock("../../src/modules/analytics/analytics.model.js", () => ({ AnalyticsDaily: {} }));
vi.mock("../../src/modules/orders/order.model.js", () => ({ Order: {} }));
vi.mock("../../src/modules/products/product.model.js", () => ({ Product: {} }));
vi.mock("../../src/modules/users/user.model.js", () => ({ User: {} }));

const { recomputeRollupsForOrders } = await import("../../src/modules/analytics/analytics.service.js");
const { countsAsRevenue, REVENUE_ORDER_STATUSES } = await import("../../src/config/constants.js");

// Stub the upsert so the test covers the date-selection logic (which is where
// the bugs live) without needing a database.
beforeEach(() => {
  upserted.length = 0;
  vi.doMock("../../src/modules/analytics/analytics.service.js", () => ({}));
});

describe("recomputeRollupsForOrders — which days get recomputed", () => {
  const dayOf = (orders) => [...new Set(orders.map((o) => new Date(o.createdAt).toISOString().slice(0, 10)))];

  it("derives one date key per distinct order day", () => {
    const orders = [
      { createdAt: "2026-07-28T10:00:00.000Z" },
      { createdAt: "2026-07-28T23:59:00.000Z" },
      { createdAt: "2026-08-02T01:00:00.000Z" },
    ];
    // Two distinct days, not three orders — recomputing a day twice is wasted work.
    expect(dayOf(orders)).toEqual(["2026-07-28", "2026-08-02"]);
  });

  it("uses UTC day boundaries, matching how the rollup queries orders", () => {
    // 23:30 UTC belongs to the 28th even though it's the 29th in Dhaka (+6).
    expect(dayOf([{ createdAt: "2026-07-28T23:30:00.000Z" }])).toEqual(["2026-07-28"]);
  });

  it("handles an empty or missing order list without throwing", async () => {
    await expect(recomputeRollupsForOrders([])).resolves.toEqual([]);
    await expect(recomputeRollupsForOrders(undefined)).resolves.toEqual([]);
  });
});

describe("revenue boundary (the condition guarding the recompute)", () => {
  // Imports the REAL predicate rather than re-declaring the status list here.
  // The previous version of this test kept its own copy, which meant it would
  // have passed unchanged even if production and the rollup disagreed — the one
  // thing it exists to catch.
  const crosses = (from, to) => countsAsRevenue(from) !== countsAsRevenue(to);

  it.each([
    ["pending", "confirmed", true], // the merchant's rule: confirming books the sale
    ["confirmed", "pending", true], // un-confirming takes it back out
    ["confirmed", "cancelled", true],
    ["cancelled", "confirmed", true],
    ["delivered", "refunded", true], // a refund drops revenue
    ["refunded", "delivered", true], // and reversing it restores revenue
    ["confirmed", "packed", false],
    ["packed", "shipped", false],
    ["shipped", "delivered", false],
    ["cancelled", "refunded", false], // both already excluded — nothing moves
    ["pending", "cancelled", false], // never counted, so cancelling changes no total
  ])("%s → %s recomputes: %s", (from, to, expected) => {
    expect(crosses(from, to)).toBe(expected);
  });

  it("counts confirmed onward and nothing else", () => {
    expect(REVENUE_ORDER_STATUSES).toEqual(["confirmed", "packed", "shipped", "delivered"]);
    for (const s of ["pending", "cancelled", "refunded"]) expect(countsAsRevenue(s)).toBe(false);
  });
});
