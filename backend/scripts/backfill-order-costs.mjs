/**
 * One-time backfill for profit reporting.
 *
 *  1. Copies each product's current `costPrice` onto order items that predate
 *     the cost snapshot, so historical orders report a real profit instead of
 *     "cost unknown". This is an approximation by definition — it uses today's
 *     cost, not the cost at the time of sale, which is exactly why new orders
 *     snapshot it. It is only reasonable because it runs once, over a handful
 *     of recent orders.
 *  2. Recomputes every daily rollup that has orders. Required, not optional:
 *     `revenue` changed meaning (now net of the delivery charge) and the
 *     counted statuses changed (confirmed-onward, so pending no longer counts),
 *     and the stored rows still hold the old numbers until recomputed.
 *
 * Idempotent — items that already carry a cost are left alone, and rollups are
 * a pure derivation of the orders collection.
 *
 *   node scripts/backfill-order-costs.mjs            # dry run, writes nothing
 *   node scripts/backfill-order-costs.mjs --apply    # actually writes
 *
 * MONGODB_URI points at the live Atlas cluster, so the default is a dry run on
 * purpose. Read the summary it prints before passing --apply.
 */
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { Order } from "../src/modules/orders/order.model.js";
import { Product } from "../src/modules/products/product.model.js";
import { upsertDailyRollup } from "../src/modules/analytics/analytics.service.js";
import { sumOrderMetrics } from "../src/modules/analytics/orderMetrics.js";
import { countsAsRevenue } from "../src/config/constants.js";

const APPLY = process.argv.includes("--apply");
const taka = (n) => `৳${Math.round(n).toLocaleString("en-IN")}`;

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`\n${APPLY ? "APPLY — writing changes" : "DRY RUN — nothing will be written"}\n${"=".repeat(46)}`);

  // ---- 1. cost snapshots -------------------------------------------------
  const orders = await Order.find({}).sort({ createdAt: 1 });
  const costs = new Map(
    (await Product.find({}).select("+costPrice").lean()).map((p) => [p._id.toString(), p.costPrice ?? null])
  );

  let itemsFilled = 0;
  let itemsAlreadySet = 0;
  let itemsNoCostKnown = 0;
  const touchedOrders = [];

  for (const order of orders) {
    let changed = false;
    for (const item of order.items) {
      if (item.costPrice != null) {
        itemsAlreadySet += 1;
        continue;
      }
      const cost = costs.get(item.product?.toString());
      if (cost == null) {
        itemsNoCostKnown += 1;
        console.log(`  ! ${order.orderNumber}: "${item.title}" — product has no costPrice, left unknown`);
        continue;
      }
      item.costPrice = cost;
      itemsFilled += 1;
      changed = true;
      console.log(`  + ${order.orderNumber}: "${item.title}" ×${item.qty} → cost ${taka(cost)}`);
    }
    if (changed) touchedOrders.push(order);
  }

  if (APPLY) {
    for (const order of touchedOrders) await order.save();
  }

  console.log(
    `\nitems: ${itemsFilled} filled · ${itemsAlreadySet} already set · ${itemsNoCostKnown} still unknown  (${touchedOrders.length} order(s) ${APPLY ? "saved" : "would be saved"})`
  );

  // ---- 2. rollup recompute ----------------------------------------------
  const dateKeys = [...new Set(orders.map((o) => o.createdAt.toISOString().slice(0, 10)))].sort();
  console.log(`\nrollup dates to recompute: ${dateKeys.length ? dateKeys.join(", ") : "(none)"}`);

  const line = (key, r) =>
    `  ${key}: sales ${taka(r.totalSales)} · delivery ${taka(r.shippingFees)} · revenue ${taka(r.revenue)} · cost ${taka(r.cogs)} · profit ${taka(r.profit)} · ${r.unitsSold} unit(s) · ${r.ordersCount} order(s)`;

  for (const key of dateKeys) {
    if (APPLY) {
      const r = await upsertDailyRollup(key);
      console.log(line(key, { ...r, profit: r.revenue - r.cogs }));
      continue;
    }
    // Preview from the IN-MEMORY orders, which already carry the costs assigned
    // above. Re-reading through computeDailyRollup would query the database,
    // where nothing has been saved yet, and report every day at zero cost and
    // therefore full profit — the one figure this preview exists to show.
    const ofDay = orders.filter(
      (o) => o.createdAt.toISOString().slice(0, 10) === key && countsAsRevenue(o.status)
    );
    console.log(line(key, sumOrderMetrics(ofDay)));
  }

  // ---- 3. what the merchant should see -----------------------------------
  const counting = orders.filter((o) => countsAsRevenue(o.status));
  const skipped = orders.filter((o) => !countsAsRevenue(o.status));
  const sales = counting.reduce((n, o) => n + o.total, 0);
  const ship = counting.reduce((n, o) => n + o.shippingFee, 0);
  console.log(
    `\nall-time (counting ${counting.length} of ${orders.length} orders; ${skipped.length} not counted: ${
      skipped.map((o) => `${o.orderNumber} ${o.status}`).join(", ") || "none"
    })`
  );
  console.log(`  total sales ${taka(sales)} − delivery ${taka(ship)} = revenue ${taka(sales - ship)}`);

  await mongoose.disconnect();
  if (!APPLY) console.log("\nNothing was written. Re-run with --apply to persist.\n");
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
