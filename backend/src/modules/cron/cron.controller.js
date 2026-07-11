import { env, isProduction } from "../../config/env.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { runNightlyAnalyticsRollup } from "../../jobs/analyticsRollup.cron.js";
import { releaseStaleReservations } from "../../jobs/releaseReservedStock.cron.js";

// On Vercel, node-cron has no persistent process to run in, so the scheduled jobs
// are invoked over HTTP by Vercel Cron. Vercel automatically sends
// `Authorization: Bearer <CRON_SECRET>` when the CRON_SECRET env var is set, which
// is what keeps these otherwise-public endpoints from being triggered by anyone.
function assertCronAuthorized(req) {
  const expected = env.CRON_SECRET;
  if (!expected) {
    // Fail closed in production: without a secret configured these endpoints
    // would be world-triggerable, so refuse rather than run unguarded.
    if (isProduction) throw ApiError.unauthorized("Cron endpoint is not configured");
    return; // dev convenience: allow manual triggering without a secret
  }
  if (req.get("authorization") !== `Bearer ${expected}`) {
    throw ApiError.unauthorized("Invalid cron credentials");
  }
}

export const runReleaseStaleReservations = asyncHandler(async (req, res) => {
  assertCronAuthorized(req);
  const released = await releaseStaleReservations();
  sendSuccess(res, { data: { released } });
});

export const runAnalyticsRollup = asyncHandler(async (req, res) => {
  assertCronAuthorized(req);
  const result = await runNightlyAnalyticsRollup();
  sendSuccess(res, { data: result });
});
