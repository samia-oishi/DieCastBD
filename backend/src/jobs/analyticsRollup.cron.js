import { upsertDailyRollup } from "../modules/analytics/analytics.service.js";

/** Rolls up *yesterday* (not today — today isn't finished yet when this runs
 * shortly after midnight). Upsert means it's safe to re-run if the job fails
 * partway or the server restarts before it fires. */
export async function runNightlyAnalyticsRollup() {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const dateKey = yesterday.toISOString().slice(0, 10);

  const result = await upsertDailyRollup(dateKey);
  console.log(`Analytics rollup for ${dateKey}: ৳${result.revenue} revenue, ${result.ordersCount} orders`);
  return result;
}
