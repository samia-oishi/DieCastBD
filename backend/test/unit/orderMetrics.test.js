import { describe, it, expect } from "vitest";

import { sumOrderMetrics, topProductsByProfit, profitMargin } from "../../src/modules/analytics/orderMetrics.js";

// Mirrors the shape the rollup loads: total already includes shipping, items
// carry the price and cost snapshotted at purchase time.
const order = ({ subtotal, discount = 0, shippingFee, items }) => ({
  total: subtotal - discount + shippingFee,
  subtotal,
  discount,
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

  it("spreads an order-level coupon across the lines by value", () => {
    // ৳60 off an order of ৳1,490 + ৳1,690: each line carries its share, not the
    // whole discount and not none of it.
    const o = order({
      subtotal: 3180,
      discount: 60,
      shippingFee: 60,
      items: [
        { product: "supra", title: "Supra", price: 1490, costPrice: 909, qty: 1 },
        { product: "bmw", title: "BMW", price: 1690, costPrice: 937, qty: 1 },
      ],
    });
    const ranked = topProductsByProfit([o]);
    const supra = ranked.find((p) => p.title === "Supra");
    const bmw = ranked.find((p) => p.title === "BMW");
    expect(supra.revenue).toBe(1462); // 1490 − 60×(1490/3180)
    expect(bmw.revenue).toBe(1658); // 1690 − 60×(1690/3180)
    expect(supra.revenue + bmw.revenue).toBe(3120); // = subtotal − discount
  });

  // The invariant the merchant's question exposed: before this, per-product
  // profit summed to MORE than the order made, by exactly the discount, so the
  // "Top products" panel contradicted the profit headline next to it.
  it.each([
    ["one coupon, two lines", { subtotal: 3180, discount: 60, shippingFee: 60, items: [item(1490, 909), item(1690, 937)] }],
    ["one coupon, one line", { subtotal: 1630, discount: 40, shippingFee: 70, items: [item(1630, 894)] }],
    ["no coupon", { subtotal: 1960, discount: 0, shippingFee: 70, items: [item(1960, 1114)] }],
    ["uneven split", { subtotal: 1000, discount: 333, shippingFee: 50, items: [item(700, 300), item(300, 100)] }],
    ["discount exceeds one line", { subtotal: 900, discount: 500, shippingFee: 0, items: [item(100, 40), item(800, 300)] }],
  ])("per-product profit reconciles to order profit — %s", (_label, spec) => {
    const o = order(spec);
    const perProduct = topProductsByProfit([o], 99).reduce((n, p) => n + p.profit, 0);
    // ±1 taka: each product is rounded once for display.
    expect(Math.abs(perProduct - sumOrderMetrics([o]).profit)).toBeLessThanOrEqual(1);
  });

  it("uses the discount stored on the order, so editing the coupon later changes nothing", () => {
    // order.discount is snapshotted at checkout (order.model.js) and never
    // recalculated — two identical orders differing only in stored discount
    // must report differently, proving nothing is re-derived from the coupon.
    const items = [item(2000, 1000)];
    const asCharged = topProductsByProfit([order({ subtotal: 2000, discount: 500, shippingFee: 0, items })]);
    const ifCouponVanished = topProductsByProfit([order({ subtotal: 2000, discount: 0, shippingFee: 0, items })]);
    expect(asCharged[0].revenue).toBe(1500);
    expect(ifCouponVanished[0].revenue).toBe(2000);
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

/** Merchant's stated rule, pinned so it cannot drift:
 *  "Discount will always deduct from the sale price & profit will be calculated
 *   after minus the discount price."
 *
 * It already held on every path when they said it — these lock it down. The
 * failure mode being guarded against is subtle: a change that computed revenue
 * from `subtotal` instead of `total - shippingFee` would still look right on
 * every order that happens to have no discount.
 */
describe("business rule — a discount comes off the sale price, and profit follows", () => {
  const withDiscount = (discount) =>
    order({ subtotal: 1890, discount, shippingFee: 70, items: [item(1890, 1054)] });

  it("deducts the discount from revenue", () => {
    expect(sumOrderMetrics([withDiscount(0)]).revenue).toBe(1890);
    expect(sumOrderMetrics([withDiscount(270)]).revenue).toBe(1620); // 1890 − 270
  });

  it("computes profit AFTER the discount, not before it", () => {
    const m = sumOrderMetrics([withDiscount(270)]);
    expect(m.profit).toBe(1620 - 1054);
    // The bug this rules out: profit taken off the pre-discount sale price.
    expect(m.profit).not.toBe(1890 - 1054);
  });

  it("moves revenue and profit by exactly the discount, and never the cost", () => {
    const before = sumOrderMetrics([withDiscount(70)]);
    const after = sumOrderMetrics([withDiscount(270)]);
    expect(before.revenue - after.revenue).toBe(200);
    expect(before.profit - after.profit).toBe(200);
    expect(after.cogs).toBe(before.cogs); // a discount is not a cost
  });

  it("keeps the delivery charge out of it — the courier's cut is separate", () => {
    const m = sumOrderMetrics([withDiscount(270)]);
    expect(m.totalSales).toBe(1690); // 1890 − 270 + 70 delivery
    expect(m.revenue).toBe(1620); // delivery removed as well
    expect(m.shippingFees).toBe(70);
  });

  it("applies the same rule to per-product profit, so the panels agree", () => {
    // Without the order-level discount being allocated across lines, the
    // "top products" figures would sum to more than the order actually made.
    const o = withDiscount(270);
    const perProduct = topProductsByProfit([o], 99).reduce((n, p) => n + p.profit, 0);
    expect(Math.abs(perProduct - sumOrderMetrics([o]).profit)).toBeLessThanOrEqual(1);
  });
});
