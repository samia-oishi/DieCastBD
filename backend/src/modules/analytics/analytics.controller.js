import { getSummary, getDailyHistory, getDailyHistoryRange } from "./analytics.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const ALLOWED_RANGES = ["today", "7", "30", "90"];

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
  const days = Math.min(Number(req.query.days) || 30, 90);
  sendSuccess(res, { data: await getDailyHistory(days) });
});
