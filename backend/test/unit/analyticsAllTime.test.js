import { describe, it, expect, vi, beforeEach } from "vitest";

// "All time" is the one range with no upper bound and no comparison window.
// Both of those are easy to regress into something that silently shows a
// 30-day or 90-day figure under a chip that promises everything, so they are
// pinned here.

const orderFinds = [];
let orderAggregates = [];
let aggregateResult = [];
let dailyQuery;

const thenableList = (items = []) => {
  const list = [...items];
  list.select = () => list;
  list.lean = () => list;
  return list;
};

vi.mock("../../src/modules/orders/order.model.js", () => ({
  Order: {
    find: (filter) => {
      orderFinds.push(filter);
      return thenableList([]);
    },
    aggregate: async (pipeline) => {
      orderAggregates.push(pipeline);
      return aggregateResult;
    },
  },
}));
vi.mock("../../src/modules/users/user.model.js", () => ({
  User: { countDocuments: async () => 0 },
}));
vi.mock("../../src/modules/products/product.model.js", () => ({
  Product: {
    countDocuments: async () => 0,
    find: () => thenableList([]),
  },
}));
vi.mock("../../src/modules/analytics/analytics.model.js", () => ({
  AnalyticsDaily: {
    find: () => dailyQuery,
  },
}));

const { getSummary, getDailyHistory } = await import("../../src/modules/analytics/analytics.service.js");

const makeDailyQuery = (rows) => {
  const q = {
    limitCalledWith: undefined,
    sort: () => q,
    limit(n) {
      q.limitCalledWith = n;
      return q;
    },
    then: (resolve) => Promise.resolve([...rows]).then(resolve),
  };
  return q;
};

beforeEach(() => {
  orderFinds.length = 0;
  orderAggregates = [];
  aggregateResult = [];
  dailyQuery = makeDailyQuery([{ date: "2026-09-20" }, { date: "2026-09-19" }]);
});

describe("getDailyHistory", () => {
  it("caps the numeric presets at the requested number of days", async () => {
    await getDailyHistory(30);
    expect(dailyQuery.limitCalledWith).toBe(30);
  });

  it("applies NO limit for all time — a cap here would make the chip lie", async () => {
    await getDailyHistory(null);
    expect(dailyQuery.limitCalledWith).toBeUndefined();
  });

  it("returns rows oldest-first whichever way it was called", async () => {
    // The model is queried newest-first (for the limit to take the most recent
    // days); the chart and table both want chronological order back.
    expect((await getDailyHistory(null)).map((r) => r.date)).toEqual(["2026-09-19", "2026-09-20"]);
  });
});

describe('getSummary("all")', () => {
  it("counts from the epoch, so no order can fall outside the window", async () => {
    const summary = await getSummary("all");
    expect(summary.startDate).toBe("1970-01-01");
    expect(orderFinds[0].createdAt.$gte).toEqual(new Date("1970-01-01T00:00:00.000Z"));
  });

  it("reports a zero prior period instead of comparing against nothing", async () => {
    const summary = await getSummary("all");
    expect(summary.prior).toEqual({ totalSales: 0, revenue: 0, profit: 0, ordersCount: 0 });
  });

  it("does not run a prior-window query at all", async () => {
    await getSummary("all");
    // A find carrying $lt would mean a prior window was queried for a range
    // that has none.
    const windowed = orderFinds.filter((f) => f.createdAt?.$lt);
    expect(windowed).toHaveLength(0);
  });

  it("still queries a prior window for the bounded ranges", async () => {
    await getSummary("30");
    expect(orderFinds.filter((f) => f.createdAt?.$lt)).toHaveLength(1);
  });

  it("falls back to today for an unrecognised range rather than all of history", async () => {
    const summary = await getSummary("nonsense");
    expect(summary.startDate).not.toBe("1970-01-01");
  });
});

describe("cancellations and payment mix", () => {
  it("counts cancelled orders, which the revenue statuses deliberately exclude", async () => {
    const summary = await getSummary("30");
    // Cancelled is queried on its own: summing it into the revenue figures
    // would book money from orders that never happened.
    const cancelledFind = orderFinds.find((f) => f.status === "cancelled");
    expect(cancelledFind).toBeDefined();
    expect(summary.cancelled).toEqual({ count: 0, value: 0 });
  });

  it("reports the payment split over the same orders the KPIs count", async () => {
    aggregateResult = [
      { _id: "cod", count: 35, value: 105160 },
      { _id: "bkash", count: 11, value: 24660 },
    ];
    const summary = await getSummary("all");
    expect(summary.paymentMix).toEqual([
      { method: "cod", count: 35, value: 105160 },
      { method: "bkash", count: 11, value: 24660 },
    ]);
  });

  it("labels an order with no payment method rather than dropping it from the mix", async () => {
    aggregateResult = [{ _id: null, count: 2, value: 500 }];
    const summary = await getSummary("30");
    // Dropping it would make the percentages silently not add to 100.
    expect(summary.paymentMix).toEqual([{ method: "unknown", count: 2, value: 500 }]);
  });

  it("counts out-of-stock separately from low-stock", async () => {
    // Two different jobs: low stock is a reorder hint, zero is a product the
    // storefront is actively hiding. They must not collapse into one number.
    const summary = await getSummary("all");
    expect(summary).toHaveProperty("outOfStockCount");
    expect(summary).toHaveProperty("lowStockCount");
  });
});
