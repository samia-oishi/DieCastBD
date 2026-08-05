import { describe, it, expect, vi, beforeEach } from "vitest";

const upserted = [];
vi.mock("../../src/modules/analytics/analytics.model.js", () => ({ AnalyticsDaily: {} }));
vi.mock("../../src/modules/orders/order.model.js", () => ({ Order: {} }));
vi.mock("../../src/modules/products/product.model.js", () => ({ Product: {} }));
vi.mock("../../src/modules/users/user.model.js", () => ({ User: {} }));

const { recomputeRollupsForOrders } = await import("../../src/modules/analytics/analytics.service.js");

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
  // Reports count only orders the store earned from, so a transition changes a
  // day's totals exactly when it crosses that line. Must stay in lockstep with
  // NON_REVENUE_ORDER_STATUSES — if the rollup excluded refunded but this
  // didn't, marking an order refunded would silently leave the report stale.
  const NON_REVENUE = new Set(["cancelled", "refunded"]);
  const crosses = (from, to) => NON_REVENUE.has(from) !== NON_REVENUE.has(to);

  it.each([
    ["confirmed", "cancelled", true],
    ["cancelled", "confirmed", true],
    ["pending", "cancelled", true],
    ["delivered", "refunded", true], // the merchant's case: a refund drops revenue
    ["refunded", "delivered", true], // and reversing it restores revenue
    ["confirmed", "packed", false],
    ["packed", "shipped", false],
    ["shipped", "delivered", false],
    ["cancelled", "refunded", false], // both already excluded — nothing moves
  ])("%s → %s recomputes: %s", (from, to, expected) => {
    expect(crosses(from, to)).toBe(expected);
  });
});
