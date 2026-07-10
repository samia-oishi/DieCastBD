import { getSummary, getDailyHistory, getDailyHistoryRange } from "./analytics.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getAnalyticsSummary = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await getSummary() });
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
