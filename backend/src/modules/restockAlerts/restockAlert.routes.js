import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { createRestockAlertSchema, listRestockAlertsSchema } from "./restockAlert.validation.js";
import { createRestockAlert, listRestockAlertsAdmin } from "./restockAlert.controller.js";

// publicRouter mounted at the same "/products" prefix as the products module's
// own router (routes/index.js) — kept as its own self-contained module
// (model/controller/validation/routes) rather than reaching into products/ for
// a foreign concern, matching this codebase's one-module-per-domain convention.
export const publicRouter = Router();
publicRouter.post("/:id/restock-alert", validate(createRestockAlertSchema), createRestockAlert);

// adminRouter mounted at "/admin/inventory" alongside that module's own router —
// the waiting-list view belongs next to stock/adjust/history on the Inventory
// page, not as a new admin page of its own.
export const adminRouter = Router();
adminRouter.get("/:id/restock-alerts", validate(listRestockAlertsSchema), listRestockAlertsAdmin);
