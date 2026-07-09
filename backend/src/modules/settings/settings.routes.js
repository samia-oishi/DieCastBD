import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/auditLog.js";
import { updateSettingsSchema } from "./settings.validation.js";
import { getSettings, updateSettings } from "./settings.controller.js";

export const publicRouter = Router();
publicRouter.get("/", getSettings);

export const adminRouter = Router();
adminRouter.patch("/", validate(updateSettingsSchema), auditLog("Settings"), updateSettings);
