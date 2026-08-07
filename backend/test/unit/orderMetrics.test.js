import { describe, it, expect } from "vitest";

import { sumOrderMetrics, topProductsByProfit, profitMargin } from "../../src/modules/analytics/orderMetrics.js";

// Mirrors the shape the rollup loads: total already includes shipping, items
// carry the price and cost snapshotted at purchase time.
const order = ({ subtotal, discount = 0, shippingFee, items }) => ({
  total: subtotal - discount + shippingFee,
  shippingFee,
  items,
});

const item = (price, costPrice, qty = 1) => ({ product: `p-${price}-${costPrice}`, title: `Item ${price}`, price, costPrice, qty });

describe("sumOrderMetrics", () => {
  it("excludes the delivery charge from revenue — the whole point of the split", () => {
    const m = sumOrderMetrics([order({ subtotal: 1630, discount: 40, shippingFee: 70, items: [item(1630, 900)] })]);
    expect(m.totalSales).toBe(1660); // what the customer paid
    expect(m.shippingFees).toBe(70); // the courier's, never ours
    expect(m.revenue).toBe(1590); // 1660 - 70
  });

  it("takes the coupon discount off revenue too — it was never received", () => {
    const withDiscount = sumOrderMetrics([order({ subtotal: 2000, discount: 500, shippingFee: 60, items: [item(2000, 1000)] })]);
    const without = sumOrderMetrics([order({ subtotal: 2000, discount: 0, shippingFee: 60, items: [item(2000, 1000)] })]);
    expect(withDiscount.revenue).toBe(1500);
    expect(without.revenue).toBe(2000);
    expect(without.profit - withDiscount.profit).toBe(500);
  });

  it("computes profit as revenue minus cost of goods", () => {
    const m = sumOrderMetrics([order({ subtotal: 2490, shippingFee: 70, items: [item(2490, 1464)] })]);
    expect(m.cogs).toBe(1464);
    expect(m.profit).toBe(2490 - 1464);
    // Shipping must not leak into profit either way.
    expect(m.profit).toBe(m.revenue - m.cogs);
  });

  it("multiplies cost by quantity", () => {
    const m = sumOrderMetrics([order({ subtotal: 3000, shippingFee: 0, items: [item(1000, 400, 3)] })]);
    expect(m.unitsSold).toBe(3);
    expect(m.cogs).toBe(1200);
    expect(m.profit).toBe(1800);
  });

  it("reports unknown cost instead of treating free stock as pure profit", () => {
    // An order placed before profit reporting has costPrice null. Counting it
    // as 0 would report 100% margin on it, which is worse than saying so.
    const m = sumOrderMetrics([order({ subtotal: 1000, shippingFee: 50, items: [item(1000, null, 2)] })]);
    expect(m.cogs).toBe(0);
    expect(m.unitsSold).toBe(2);
    expect(m.unitsMissingCost).toBe(2);
  });

  it("adds up across orders and counts them", () => {
    const m = sumOrderMetrics([
      order({ subtotal: 1000, shippingFee: 60, items: [item(1000, 600)] }),
      order({ subtotal: 2000, shippingFee: 70, items: [item(2000, 900)] }),
    ]);
    expect(m.ordersCount).toBe(2);
    expect(m.totalSales).toBe(3130);
    expect(m.shippingFees).toBe(130);
    expect(m.revenue).toBe(3000);
    expect(m.cogs).toBe(1500);
    expect(m.profit).toBe(1500);
  });

  it("returns zeroes, not NaN, for a day with no orders", () => {
    const m = sumOrderMetrics([]);
    expect(m).toMatchObject({ totalSales: 0, shippingFees: 0, revenue: 0, cogs: 0, profit: 0, unitsSold: 0, ordersCount: 0 });
  });

  it("reconciles against the three real orders on file", () => {
    // Guards the arithmetic the merchant will eyeball on the Reports page.
    const m = sumOrderMetrics([
      order({ subtotal: 3180, discount: 60, shippingFee: 60, items: [item(1590, 900, 2)] }),
      order({ subtotal: 1960, shippingFee: 70, items: [item(1960, 1100)] }),
      order({ subtotal: 1630, discount: 40, shippingFee: 70, items: [item(1630, 894)] }),
    ]);
    expect(m.totalSales).toBe(6870);
    expect(m.shippingFees).toBe(200);
    expect(m.revenue).toBe(6670);
  });
});

describe("topProductsByProfit", () => {
  it("ranks by profit, not units — a cheap bestseller can earn the least", () => {
    const cheap = { product: "cheap", title: "Cheap", price: 200, costPrice: 180, qty: 10 }; // 200 profit
    const rich = { product: "rich", title: "Rich", price: 3490, costPrice: 1426, qty: 1 }; // 2064 profit
    const ranked = topProductsByProfit([order({ subtotal: 5490, shippingFee: 0, items: [cheap, rich] })]);
    expect(ranked[0].title).toBe("Rich");
    expect(ranked[0].profit).toBe(2064);
    expect(ranked[1].profit).toBe(200);
    expect(ranked[1].unitsSold).toBe(10); // still reports the volume
  });

  it("merges the same product across orders", () => {
    const line = () => ({ product: "same", title: "Same", price: 1000, costPrice: 600, qty: 1 });
    const ranked = topProductsByProfit([
      order({ subtotal: 1000, shippingFee: 0, items: [line()] }),
      order({ subtotal: 1000, shippingFee: 0, items: [line()] }),
    ]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].unitsSold).toBe(2);
    expect(ranked[0].profit).toBe(800);
  });

  it("credits revenue but no profit when cost is unknown", () => {
    const ranked = topProductsByProfit([order({ subtotal: 1000, shippingFee: 0, items: [item(1000, null)] })]);
    expect(ranked[0].revenue).toBe(1000);
    expect(ranked[0].profit).toBe(0);
  });

  it("honours the limit", () => {
    const items = Array.from({ length: 9 }, (_, i) => ({ product: `p${i}`, title: `P${i}`, price: 100 * (i + 1), costPrice: 10, qty: 1 }));
    expect(topProductsByProfit([order({ subtotal: 4500, shippingFee: 0, items })])).toHaveLength(5);
    expect(topProductsByProfit([order({ subtotal: 4500, shippingFee: 0, items })], 3)).toHaveLength(3);
  });
});

describe("profitMargin", () => {
  it("is a percentage of revenue, to one decimal", () => {
    expect(profitMargin({ revenue: 1000, profit: 441 })).toBe(44.1);
  });

  it("is null with no revenue — 'no sales' is not 'zero margin'", () => {
    expect(profitMargin({ revenue: 0, profit: 0 })).toBeNull();
  });

  it("goes negative when goods sold below cost", () => {
    expect(profitMargin({ revenue: 1000, profit: -200 })).toBe(-20);
  });
});
