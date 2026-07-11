import { Router } from "express";
import { runReleaseStaleReservations, runAnalyticsRollup } from "./cron.controller.js";

// Driven by Vercel Cron (see vercel.json). GET so the platform scheduler can hit
// them; each handler checks the Bearer CRON_SECRET before doing any work.
const router = Router();

router.get("/release-stale-reservations", runReleaseStaleReservations);
router.get("/analytics-rollup", runAnalyticsRollup);

export default router;
