import { Router } from "express";

import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/auditLog.js";
import { Order } from "../orders/order.model.js";
import { orderIdParamSchema, syncSchema } from "./courier.validation.js";
import { sendToCourier, syncCourier, courierStatus } from "./courier.controller.js";

const router = Router();

router.get("/status", courierStatus);

// Creating a consignment spends money and dispatches a real collection, so it
// is audited like any other admin mutation.
router.post("/orders/:id", validate(orderIdParamSchema), auditLog("Order", Order), sendToCourier);

// Read-through refresh: no auditLog, it mutates only our cached copy of the
// courier's own status and runs on every orders-list open.
router.post("/sync", validate(syncSchema), syncCourier);

export default router;
