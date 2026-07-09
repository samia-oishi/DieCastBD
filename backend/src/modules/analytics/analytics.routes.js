import { Router } from "express";
import { getAnalyticsSummary, getAnalyticsDaily } from "./analytics.controller.js";

const router = Router();
router.get("/summary", getAnalyticsSummary);
router.get("/daily", getAnalyticsDaily);

export default router;
