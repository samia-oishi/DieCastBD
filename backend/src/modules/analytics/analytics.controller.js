import { getSummary, getDailyHistory } from "./analytics.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getAnalyticsSummary = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await getSummary() });
});

export const getAnalyticsDaily = asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  sendSuccess(res, { data: await getDailyHistory(days) });
});
