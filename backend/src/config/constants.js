// Collector diecast is seeded with naturally thin per-SKU stock (1-4 units
// typical) — a bulkier-retail threshold (e.g. 10) would flag nearly the whole
// catalog as low-stock and make the signal useless. Shared by the analytics
// rollup and the inventory admin view so "low stock" never means two different
// things in two different places.
export const LOW_STOCK_THRESHOLD = 2;

/** Order statuses that do NOT count as revenue.
 *
 * A cancelled order was never fulfilled; a refunded one gave the money back —
 * neither is income, so reporting them as revenue overstates what the store
 * actually earned. Shared so the daily rollup, the dashboard summary and the
 * per-customer lifetime spend can never drift into three different answers
 * (they briefly did: customer stats excluded both while analytics excluded
 * only cancelled, so a refund inflated Reports but not the customer's totals).
 */
export const NON_REVENUE_ORDER_STATUSES = ["cancelled", "refunded"];
