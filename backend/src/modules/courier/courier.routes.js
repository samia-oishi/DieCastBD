import { Router } from "express";

import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/auditLog.js";
import { Order } from "../orders/order.model.js";
import { orderIdParamSchema, syncSchema, linkSchema } from "./courier.validation.js";
import { sendToCourier, syncCourier, courierStatus, linkCourier } from "./courier.controller.js";

const router = Router();

router.get("/status", courierStatus);

// Creating a consignment spends money and dispatches a real collection, so it
// is audited like any other admin mutation.
router.post("/orders/:id", validate(orderIdParamSchema), auditLog("Order", Order), sendToCourier);

// Attaching a parcel the merchant booked in Steadfast themselves. Audited: it
// changes what this order claims to be tracking.
router.post("/orders/:id/link", validate(linkSchema), auditLog("Order", Order), linkCourier);

// Read-through refresh: no auditLog, it mutates only our cached copy of the
// courier's own status and runs on every orders-list open.
router.post("/sync", validate(syncSchema), syncCourier);

export default router;
