import { Order } from "../orders/order.model.js";
import { Product } from "../products/product.model.js";
import { User } from "../users/user.model.js";
import { AnalyticsDaily } from "./analytics.model.js";
import { LOW_STOCK_THRESHOLD } from "../../config/constants.js";

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

export async function computeDailyRollup(dateKey) {
  const startOfDay = new Date(`${dateKey}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateKey}T23:59:59.999Z`);

  const [orders, newCustomers, lowStockCount] = await Promise.all([
    Order.find({ createdAt: { $gte: startOfDay, $lte: endOfDay }, status: { $ne: "cancelled" } }),
    User.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
    Product.countDocuments({
      status: "active",
      isDeleted: false,
      $expr: { $lte: [{ $subtract: ["$stock", "$reservedStock"] }, LOW_STOCK_THRESHOLD] },
    }),
  ]);

  const revenue = orders.reduce((sum, o) => sum + o.total, 0);

  const unitsByProduct = new Map();
  for (const order of orders) {
    for (const item of order.items) {
      const key = item.product.toString();
      const entry = unitsByProduct.get(key) ?? { product: item.product, title: item.title, unitsSold: 0 };
      entry.unitsSold += item.qty;
      unitsByProduct.set(key, entry);
    }
  }
  const topProducts = [...unitsByProduct.values()].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);

  return { date: dateKey, revenue, ordersCount: orders.length, newCustomers, topProducts, lowStockCount };
}

export async function upsertDailyRollup(dateKey) {
  const data = await computeDailyRollup(dateKey);
  await AnalyticsDaily.findOneAndUpdate({ date: dateKey }, data, { upsert: true, setDefaultsOnInsert: true });
  return data;
}

export async function getSummary() {
  const today = toDateKey(new Date());
  const todayStats = await computeDailyRollup(today);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  const weekOrders = await Order.find({ createdAt: { $gte: sevenDaysAgo }, status: { $ne: "cancelled" } });
  const weekRevenue = weekOrders.reduce((sum, o) => sum + o.total, 0);

  return {
    today: todayStats,
    last7Days: { revenue: weekRevenue, ordersCount: weekOrders.length },
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
