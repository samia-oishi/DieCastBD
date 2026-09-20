import { describe, it, expect } from "vitest";

import { toWeekly, weekStartKey, WEEKLY_ABOVE } from "./revenueChartData";

// Above WEEKLY_ABOVE points the chart rolls days into weeks. The bucketing is
// the only real logic in this component, and getting it wrong misreports money
// rather than just looking wrong, so it is pinned here.

const day = (date, revenue, cogs, ordersCount = 1) => ({ date, revenue, cogs, ordersCount });

describe("weekStartKey", () => {
  it("snaps every day of a week to the same Monday", () => {
    // 2026-09-14 is a Monday; through Sunday the 20th they share a bucket.
    const week = ["2026-09-14", "2026-09-15", "2026-09-17", "2026-09-20"];
    expect(week.map(weekStartKey)).toEqual(Array(4).fill("2026-09-14"));
  });

  it("puts Sunday with the week it ends, not the one that follows", () => {
    // The classic off-by-one: getUTCDay() is 0 for Sunday, so a naive
    // subtraction moves it forward a week instead of back six days.
    expect(weekStartKey("2026-09-20")).toBe("2026-09-14");
    expect(weekStartKey("2026-09-21")).toBe("2026-09-21");
  });

  it("crosses a month boundary without losing the day", () => {
    expect(weekStartKey("2026-10-01")).toBe("2026-09-28");
  });
});

describe("toWeekly", () => {
  it("sums money and orders within a week rather than averaging or replacing", () => {
    const [week] = toWeekly([day("2026-09-14", 1000, 600), day("2026-09-16", 500, 300, 2)]);
    expect(week).toMatchObject({ date: "2026-09-14", revenue: 1500, cogs: 900, ordersCount: 3, days: 2 });
  });

  it("keeps weeks in chronological order whatever order the rows arrive in", () => {
    const rows = [day("2026-09-21", 10, 5), day("2026-09-07", 10, 5), day("2026-09-14", 10, 5)];
    expect(toWeekly(rows).map((w) => w.date)).toEqual(["2026-09-07", "2026-09-14", "2026-09-21"]);
  });

  it("preserves the grand total — no taka may be lost in the bucketing", () => {
    const rows = Array.from({ length: 56 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 6, 28 + i)).toISOString().slice(0, 10);
      return day(d, 100 + i, 50);
    });
    const weeks = toWeekly(rows);
    const sum = (list, pick) => list.reduce((n, r) => n + pick(r), 0);
    expect(sum(weeks, (w) => w.revenue)).toBe(sum(rows, (r) => r.revenue));
    expect(sum(weeks, (w) => w.cogs)).toBe(sum(rows, (r) => r.cogs));
    expect(sum(weeks, (w) => w.ordersCount)).toBe(sum(rows, (r) => r.ordersCount));
  });

  it("collapses 56 daily points into a readable number of bars", () => {
    const rows = Array.from({ length: 56 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 6, 28 + i)).toISOString().slice(0, 10);
      return day(d, 100, 50);
    });
    expect(rows.length).toBeGreaterThan(WEEKLY_ABOVE);
    expect(toWeekly(rows).length).toBeLessThanOrEqual(9);
  });

  it("counts a zero-revenue day as a real day, not a missing one", () => {
    // Zero days are the majority on this shop's data; dropping them would
    // shorten the axis and misplace every bar after the gap.
    const [week] = toWeekly([day("2026-09-14", 0, 0, 0), day("2026-09-15", 500, 200)]);
    expect(week.days).toBe(2);
    expect(week.revenue).toBe(500);
  });
});
