import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/auditLog.js";
import {
  createOrderSchema,
  orderNumberParamSchema,
  listOrdersQuerySchema,
  updateStatusSchema,
  idParamSchema,
} from "./order.validation.js";
import {
  createOrder,
  getMyOrders,
  getMyOrderByNumber,
  listOrdersAdmin,
  getOrderAdmin,
  updateOrderStatusAdmin,
} from "./order.controller.js";
import { Order } from "./order.model.js";

export const customerRouter = Router();
customerRouter.use(authenticate);
customerRouter.post("/", validate(createOrderSchema), createOrder);
customerRouter.get("/", getMyOrders);
customerRouter.get("/:orderNumber", validate(orderNumberParamSchema), getMyOrderByNumber);

export const adminRouter = Router();
adminRouter.get("/", validate(listOrdersQuerySchema), listOrdersAdmin);
adminRouter.get("/:id", validate(idParamSchema), getOrderAdmin);
adminRouter.patch(
  "/:id/status",
  validate(updateStatusSchema),
  auditLog("Order", Order),
  updateOrderStatusAdmin
);
