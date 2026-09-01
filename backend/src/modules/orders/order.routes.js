import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { optionalAuthenticate } from "../../middlewares/optionalAuthenticate.js";
import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/auditLog.js";
import {
  createOrderSchema,
  orderNumberParamSchema,
  listOrdersQuerySchema,
  updateStatusSchema,
  idParamSchema,
  deleteOrdersSchema,
  adjustPaymentSchema,
} from "./order.validation.js";
import {
  createOrder,
  getMyOrders,
  getMyOrderByNumber,
  listOrdersAdmin,
  getOrderAdmin,
  updateOrderStatusAdmin,
  deleteOrdersAdmin,
  adjustOrderPaymentAdmin,
} from "./order.controller.js";
import { Order } from "./order.model.js";

export const customerRouter = Router();
// Order creation must serve guests too, so it gets the optional variant instead
// of the router-wide authenticate() every other route here still requires —
// "my orders" history/detail stay authenticated-only (a guest has no session to
// list orders against; they get their receipt via the order-confirmation
// response/email instead, not an authenticated order-history page).
customerRouter.post("/", optionalAuthenticate, validate(createOrderSchema), createOrder);
customerRouter.get("/", authenticate, getMyOrders);
customerRouter.get("/:orderNumber", authenticate, validate(orderNumberParamSchema), getMyOrderByNumber);

export const adminRouter = Router();
adminRouter.get("/", validate(listOrdersQuerySchema), listOrdersAdmin);
adminRouter.get("/:id", validate(idParamSchema), getOrderAdmin);
adminRouter.patch(
  "/:id/status",
  validate(updateStatusSchema),
  auditLog("Order", Order),
  updateOrderStatusAdmin
);

// Money changes are audited like any other admin mutation — this one moves what
// a customer is charged at their door.
adminRouter.patch(
  "/:id/payment",
  validate(adjustPaymentSchema),
  auditLog("Order", Order),
  adjustOrderPaymentAdmin
);

// Bulk delete. No auditLog() middleware here on purpose — that helper keys off a
// single req.params.id, and a bulk delete needs a separate full "before" snapshot
// per order. deleteOrders() writes those itself, inside the same transaction (and
// once the rows are gone, those snapshots are the only surviving copy).
adminRouter.delete("/", validate(deleteOrdersSchema), deleteOrdersAdmin);
