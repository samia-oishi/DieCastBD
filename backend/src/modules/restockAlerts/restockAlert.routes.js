import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { createRestockAlertSchema } from "./restockAlert.validation.js";
import { createRestockAlert } from "./restockAlert.controller.js";

// Mounted at the same "/products" prefix as the products module's own router
// (routes/index.js) — kept as its own self-contained module (model/controller/
// validation/routes) rather than reaching into products/ for a foreign concern,
// matching this codebase's one-module-per-domain convention.
export const publicRouter = Router();
publicRouter.post("/:id/restock-alert", validate(createRestockAlertSchema), createRestockAlert);
