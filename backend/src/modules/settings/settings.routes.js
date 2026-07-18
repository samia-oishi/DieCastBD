import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/auditLog.js";
import { upload } from "../../middlewares/upload.js";
import { updateSettingsSchema } from "./settings.validation.js";
import { getSettings, updateSettings, uploadSettingsImage, getShareImage } from "./settings.controller.js";

export const publicRouter = Router();
publicRouter.get("/", getSettings);
publicRouter.get("/share-image", getShareImage);

export const adminRouter = Router();
// Admin reads the same document through its own uncached route — the editing
// surface must never be served a stale copy of the thing it just saved.
adminRouter.get("/", (req, res, next) => { res.set("Cache-Control", "no-store"); next(); }, getSettings);
adminRouter.patch("/", validate(updateSettingsSchema), auditLog("Settings"), updateSettings);
adminRouter.post("/upload-image", upload.single("image"), uploadSettingsImage);
