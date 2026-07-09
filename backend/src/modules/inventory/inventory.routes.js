import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/auditLog.js";
import { listInventoryQuerySchema, productIdParamSchema, adjustStockSchema } from "./inventory.validation.js";
import { listInventory, getProductInventoryLogs, adjustStock } from "./inventory.controller.js";
import { Product } from "../products/product.model.js";

const router = Router();
router.get("/", validate(listInventoryQuerySchema), listInventory);
router.get("/:id/logs", validate(productIdParamSchema), getProductInventoryLogs);
router.post("/:id/adjust", validate(adjustStockSchema), auditLog("Product", Product), adjustStock);

export default router;
