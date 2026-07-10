import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/auditLog.js";
import { createPageSchema, updatePageSchema, idParamSchema, slugParamSchema } from "./page.validation.js";
import { getPageBySlug, listPagesAdmin, getPageAdmin, createPage, updatePage } from "./page.controller.js";
import { Page } from "./page.model.js";

export const publicRouter = Router();
publicRouter.get("/:slug", validate(slugParamSchema), getPageBySlug);

export const adminRouter = Router();
adminRouter.get("/", listPagesAdmin);
adminRouter.get("/:id", validate(idParamSchema), getPageAdmin);
adminRouter.post("/", validate(createPageSchema), auditLog("Page"), createPage);
adminRouter.patch("/:id", validate(updatePageSchema), auditLog("Page", Page), updatePage);
