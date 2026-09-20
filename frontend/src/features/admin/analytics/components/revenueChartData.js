/** Bucketing for the revenue chart.
 *
 * Its own module rather than living in RevenueChart.jsx so that file exports
 * only a component (Fast Refresh stops working for a file that mixes the two),
 * and so this logic can be tested directly — asserting it through rendered SVG
 * rects would prove very little about the arithmetic.
 */

// Above this many daily points the bars get too thin to read and the date axis
// turns into a smear, so the series is rolled up into calendar weeks instead.
// 31 keeps the 30-day range daily (where day-to-day detail is the point) and
// switches 90-day and All time to weeks.
export const WEEKLY_ABOVE = 31;

/** The Monday (UTC) of the week a date key falls in. Weeks are bucketed by
 * calendar rather than by "last 7 days from today" so a bucket's label means
 * the same thing tomorrow as it does today. */
export function weekStartKey(dateKey) {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  // getUTCDay() is 0 on Sunday, so shift the week to start on Monday before
  // subtracting — otherwise a Sunday rolls forward into the next week.
  const mondayOffset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - mondayOffset);
  return d.toISOString().slice(0, 10);
}

/** Rolls daily rollup rows into weeks, keeping the same field names so the
 * chart does not care which granularity it was handed. */
export function toWeekly(rows) {
  const buckets = new Map();
  for (const row of rows) {
    const key = weekStartKey(row.date);
    const bucket = buckets.get(key) ?? { date: key, revenue: 0, cogs: 0, ordersCount: 0, days: 0 };
    bucket.revenue += row.revenue ?? 0;
    bucket.cogs += row.cogs ?? 0;
    bucket.ordersCount += row.ordersCount ?? 0;
    bucket.days += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}
