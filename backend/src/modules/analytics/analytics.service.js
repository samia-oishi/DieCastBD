import { Order } from "../orders/order.model.js";
import { Product } from "../products/product.model.js";
import { User } from "../users/user.model.js";
import { AnalyticsDaily } from "./analytics.model.js";
import { sumOrderMetrics, topProductsByProfit } from "./orderMetrics.js";
import { effectivePrice } from "../../utils/pricing.js";
import { LOW_STOCK_THRESHOLD, REVENUE_ORDER_STATUSES } from "../../config/constants.js";

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

/** Days back from today, as a UTC date key — the same keys the rollup writes. */
function dateKeyDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return toDateKey(d);
}

export async function computeDailyRollup(dateKey) {
  const startOfDay = new Date(`${dateKey}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateKey}T23:59:59.999Z`);

  const [orders, newCustomers, lowStockCount] = await Promise.all([
    Order.find({ createdAt: { $gte: startOfDay, $lte: endOfDay }, status: { $in: REVENUE_ORDER_STATUSES } }),
    User.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
    Product.countDocuments({
      status: "active",
      isDeleted: false,
      $expr: { $lte: [{ $subtract: ["$stock", "$reservedStock"] }, LOW_STOCK_THRESHOLD] },
    }),
  ]);

  // Orders are keyed to the day they were PLACED, not the day they were
  // confirmed — so confirming yesterday's order updates yesterday's row, and
  // the day a sale belongs to never moves under the merchant's feet.
  const metrics = sumOrderMetrics(orders);

  return {
    date: dateKey,
    ...metrics,
    topProducts: topProductsByProfit(orders),
    newCustomers,
    lowStockCount,
  };
}

export async function upsertDailyRollup(dateKey) {
  const data = await computeDailyRollup(dateKey);
  await AnalyticsDaily.findOneAndUpdate({ date: dateKey }, data, { upsert: true, setDefaultsOnInsert: true });
  return data;
}

/** Recomputes the rollup for whichever days these orders fall on.
 *
 * The daily rows are a DERIVATION of the orders collection, but the cron only
 * ever recomputes yesterday — so any later edit to an older order left its day
 * frozen at the old numbers forever. Deleting orders was the visible case
 * (reports kept showing revenue for orders that no longer existed), but
 * confirming, cancelling or restoring an old order drifts the same way, since
 * the rollup counts only confirmed-onward orders.
 *
 * Because the rollup is derived, recomputing is idempotent and self-healing:
 * it always converges on what the orders actually say. Callers pass the orders
 * BEFORE mutating them (a deleted order can't be read afterwards).
 */
export async function recomputeRollupsForOrders(orders) {
  const dateKeys = [...new Set((orders ?? []).map((o) => toDateKey(new Date(o.createdAt))))];
  await Promise.all(dateKeys.map((key) => upsertDailyRollup(key)));
  return dateKeys;
}

/** Money sitting in the warehouse: what the unsold stock cost, and what it
 * would bring in at current selling prices.
 *
 * Reads costPrice explicitly (select:false) and prices the retail side through
 * the shared effectivePrice helper, so a sale price is honoured exactly as it
 * is at checkout rather than re-derived here. */
export async function getInventoryValuation() {
  const products = await Product.find({ status: "active", isDeleted: false })
    .select("+costPrice price salePrice stock")
    .lean();

  let atCost = 0;
  let atRetail = 0;
  let unitsInStock = 0;
  let productsMissingCost = 0;

  for (const p of products) {
    const stock = p.stock ?? 0;
    unitsInStock += stock;
    atRetail += effectivePrice(p) * stock;
    if (p.costPrice == null) productsMissingCost += 1;
    else atCost += p.costPrice * stock;
  }

  return { atCost, atRetail, unitsInStock, productsMissingCost };
}

/** Orders placed but not yet confirmed.
 *
 * These deliberately do NOT count as revenue — nobody has accepted them yet.
 * Surfaced separately so that excluding them doesn't make them invisible: this
 * is the queue the merchant needs to act on. */
export async function getPendingPipeline() {
  const orders = await Order.find({ status: "pending" }).select("total");
  return { value: orders.reduce((sum, o) => sum + (o.total ?? 0), 0), count: orders.length };
}

const RANGE_DAYS = { today: 0, "7": 6, "30": 29, "90": 89 };

/** Dashboard summary for one of the preset ranges.
 *
 * Computed from the orders collection rather than summed from the daily rows,
 * so it is correct the instant an order changes — the rollup catches up for
 * history, but the dashboard must never lag behind a confirmation the merchant
 * just made. */
export async function getSummary(range = "today") {
  const days = RANGE_DAYS[String(range)] ?? RANGE_DAYS.today;
  const startKey = dateKeyDaysAgo(days);
  const start = new Date(`${startKey}T00:00:00.000Z`);

  const [orders, newCustomers, lowStockCount, valuation, pending] = await Promise.all([
    Order.find({ createdAt: { $gte: start }, status: { $in: REVENUE_ORDER_STATUSES } }),
    User.countDocuments({ createdAt: { $gte: start } }),
    Product.countDocuments({
      status: "active",
      isDeleted: false,
      $expr: { $lte: [{ $subtract: ["$stock", "$reservedStock"] }, LOW_STOCK_THRESHOLD] },
    }),
    getInventoryValuation(),
    getPendingPipeline(),
  ]);

  // The immediately-preceding window of equal length, for the delta pills.
  const priorStart = new Date(`${dateKeyDaysAgo(days * 2 + 1)}T00:00:00.000Z`);
  const priorOrders = await Order.find({
    createdAt: { $gte: priorStart, $lt: start },
    status: { $in: REVENUE_ORDER_STATUSES },
  });
  const prior = sumOrderMetrics(priorOrders);

  return {
    range: String(range),
    startDate: startKey,
    ...sumOrderMetrics(orders),
    topProducts: topProductsByProfit(orders),
    newCustomers,
    lowStockCount,
    inventory: valuation,
    pending,
    prior: { totalSales: prior.totalSales, revenue: prior.revenue, profit: prior.profit, ordersCount: prior.ordersCount },
  };
}

export async function getDailyHistory(days = 30) {
  return AnalyticsDaily.find().sort({ date: -1 }).limit(days).then((rows) => rows.reverse());
}

// `date` is a YYYY-MM-DD string, so lexicographic comparison sorts/ranges
// correctly — no Date conversion needed. Powers the Dashboard's custom-range
// filter (System 8, post-launch); `days`-based history above is unaffected
// and keeps backing the Reports page's 7/30/90 presets unchanged.
export async function getDailyHistoryRange(startDate, endDate) {
  return AnalyticsDaily.find({ date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 });
}
