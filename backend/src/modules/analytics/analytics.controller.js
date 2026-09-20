import { getSummary, getDailyHistory, getDailyHistoryRange } from "./analytics.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const ALLOWED_RANGES = ["today", "7", "30", "90", "all"];

export const getAnalyticsSummary = asyncHandler(async (req, res) => {
  // Unknown/absent range falls back to "today" rather than 400-ing — an older
  // dashboard build sends no range at all and must keep working.
  const range = ALLOWED_RANGES.includes(String(req.query.range)) ? String(req.query.range) : "today";
  sendSuccess(res, { data: await getSummary(range) });
});

export const getAnalyticsDaily = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  if (startDate && endDate) {
    sendSuccess(res, { data: await getDailyHistoryRange(startDate, endDate) });
    return;
  }
  // "all" is deliberately uncapped, unlike the numeric presets. The rollup
  // writes exactly one small document per day, so the entire history is a few
  // hundred docs at most — there is nothing here worth paginating, and capping
  // it would make an "All time" chip quietly lie.
  if (String(req.query.days) === "all") {
    sendSuccess(res, { data: await getDailyHistory(null) });
    return;
  }
  const days = Math.min(Number(req.query.days) || 30, 90);
  sendSuccess(res, { data: await getDailyHistory(days) });
});
