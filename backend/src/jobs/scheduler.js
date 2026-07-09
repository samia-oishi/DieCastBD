import cron from "node-cron";
import { runNightlyAnalyticsRollup } from "./analyticsRollup.cron.js";
import { releaseStaleReservations } from "./releaseReservedStock.cron.js";

export function startScheduledJobs() {
  // 00:05 UTC daily — rolls up the previous day once it's fully over.
  cron.schedule("5 0 * * *", () => {
    runNightlyAnalyticsRollup().catch((err) => console.error("Analytics rollup failed:", err.message));
  });

  // Hourly — order volume here is low enough that this is cheap, and it
  // bounds how long a stale reservation can hold stock hostage to ~1h + 48h.
  cron.schedule("0 * * * *", () => {
    releaseStaleReservations().catch((err) => console.error("Stale reservation release failed:", err.message));
  });

  console.log("Scheduled jobs started: analytics rollup (nightly), stale reservation release (hourly)");
}
