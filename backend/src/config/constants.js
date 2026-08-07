// Collector diecast is seeded with naturally thin per-SKU stock (1-4 units
// typical) — a bulkier-retail threshold (e.g. 10) would flag nearly the whole
// catalog as low-stock and make the signal useless. Shared by the analytics
// rollup and the inventory admin view so "low stock" never means two different
// things in two different places.
export const LOW_STOCK_THRESHOLD = 2;

/** Order statuses that DO count as a sale.
 *
 * A sale is booked the moment the admin confirms the order, and comes back out
 * if it is later cancelled, returned or refunded — merchant's rule, so the
 * numbers track the order's live status rather than a single moment in time.
 *
 * `pending` is excluded on purpose: it is an unvetted order that nobody has
 * accepted yet. It used to count (the old list excluded only cancelled and
 * refunded), which was one of two reasons reported revenue read high — the
 * other being the delivery charge, see REVENUE excluding shippingFee in
 * analytics.service.js.
 *
 * Written as a positive list rather than an exclusion list so that a status
 * added later defaults to NOT counting, instead of silently counting until
 * someone notices.
 *
 * Shared so the daily rollup, the dashboard summary and the per-customer
 * lifetime spend can never drift into three different answers (they briefly
 * did: customer stats excluded refunds while analytics didn't, so a refund
 * inflated Reports but not the customer's totals).
 */
export const REVENUE_ORDER_STATUSES = ["confirmed", "packed", "shipped", "delivered"];

/** True when an order in this status counts toward sales, revenue and profit. */
export function countsAsRevenue(status) {
  return REVENUE_ORDER_STATUSES.includes(status);
}
