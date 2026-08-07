/** THE single definition of what an order is worth to the store.
 *
 * Reports previously showed `order.total` and called it "Revenue". That total
 * includes the delivery charge, which the courier deducts — the store never
 * receives it — so every headline figure overstated earnings. The split here is
 * the merchant's own:
 *
 *   totalSales  what the customer paid            = subtotal - discount + shippingFee
 *   shippingFee collected for the courier         (passed straight through, never income)
 *   revenue     what the store actually takes     = totalSales - shippingFee
 *   cogs        what the goods cost us            = Σ costPrice × qty
 *   profit      revenue - cogs
 *
 * Kept in its own module, and used by both the daily rollup and the dashboard
 * summary, for the same reason `effectivePrice` exists in utils/pricing.js: the
 * moment two places compute money separately they drift, and money bugs in this
 * project have all been drift bugs.
 */

/** Rolls a list of orders up into one set of totals.
 *
 * Callers MUST pass only orders that count (see REVENUE_ORDER_STATUSES) — this
 * function does no status filtering, so it stays usable for "what would this
 * one order contribute" as well as whole-day sums.
 */
export function sumOrderMetrics(orders) {
  let totalSales = 0;
  let shippingFees = 0;
  let cogs = 0;
  let unitsSold = 0;
  // Profit is only honest if we knew the cost of everything sold. An item whose
  // costPrice is null (placed before profit reporting, or a product with no cost
  // recorded) would otherwise be silently treated as free and inflate profit, so
  // it is counted here and surfaced instead of hidden.
  let unitsMissingCost = 0;

  for (const order of orders) {
    totalSales += order.total ?? 0;
    shippingFees += order.shippingFee ?? 0;

    for (const item of order.items ?? []) {
      const qty = item.qty ?? 0;
      unitsSold += qty;
      if (item.costPrice == null) unitsMissingCost += qty;
      else cogs += item.costPrice * qty;
    }
  }

  const revenue = totalSales - shippingFees;

  return {
    totalSales,
    shippingFees,
    revenue,
    cogs,
    profit: revenue - cogs,
    unitsSold,
    unitsMissingCost,
    ordersCount: orders.length,
  };
}

/** Units sold, revenue and profit per product, biggest profit first.
 *
 * Ranked by profit rather than units on purpose: a cheap item can top the
 * units chart while earning the least of anything in the catalogue.
 *
 * A coupon discount is charged against the ORDER, not against any one line, so
 * it is spread across the lines in proportion to their value. Without that,
 * these per-product profits sum to MORE than the order actually made — the
 * whole discount goes unaccounted for, and the panel quietly contradicts the
 * headline profit beside it.
 *
 * The discount used is `order.discount`, the amount stored on the order at
 * checkout. It is never recalculated from the coupon: editing or deleting
 * FREEDHK later must not change what a July order earned.
 */
export function topProductsByProfit(orders, limit = 5) {
  const byProduct = new Map();

  for (const order of orders) {
    // Summed from the lines rather than read from order.subtotal, so the shares
    // provably add to 1 and the allocation can't leak a taka.
    const lineTotal = (order.items ?? []).reduce((n, i) => n + (i.price ?? 0) * (i.qty ?? 0), 0);
    const discount = order.discount ?? 0;

    for (const item of order.items ?? []) {
      const key = item.product?.toString();
      if (!key) continue;
      const entry = byProduct.get(key) ?? { product: item.product, title: item.title, unitsSold: 0, revenue: 0, profit: 0 };
      const qty = item.qty ?? 0;
      const gross = (item.price ?? 0) * qty;
      const net = lineTotal ? gross - discount * (gross / lineTotal) : gross;

      entry.unitsSold += qty;
      entry.revenue += net;
      // Unknown cost contributes revenue but no profit, rather than pretending
      // the margin is 100%.
      entry.profit += item.costPrice == null ? 0 : net - item.costPrice * qty;
      entry.title = item.title ?? entry.title;
      byProduct.set(key, entry);
    }
  }

  // Rounded once at the end, after every order's exact share has accumulated —
  // rounding per line would drift away from the order total.
  return [...byProduct.values()]
    .map((e) => ({ ...e, revenue: Math.round(e.revenue), profit: Math.round(e.profit) }))
    .sort((a, b) => b.profit - a.profit || b.unitsSold - a.unitsSold)
    .slice(0, limit);
}

/** Profit as a share of revenue, rounded to one decimal.
 * Null (not 0) when there is no revenue — "no sales" and "sold at zero margin"
 * are different facts and the dashboard shows them differently. */
export function profitMargin({ revenue, profit }) {
  if (!revenue) return null;
  return Math.round((profit / revenue) * 1000) / 10;
}
