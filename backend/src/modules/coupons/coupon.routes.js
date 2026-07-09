import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/auditLog.js";
import {
  validateCouponSchema,
  idParamSchema,
  listCouponsQuerySchema,
  createCouponSchema,
  updateCouponSchema,
} from "./coupon.validation.js";
import {
  validateCoupon,
  listCouponsAdmin,
  getCouponAdmin,
  createCouponAdmin,
  updateCouponAdmin,
  deleteCouponAdmin,
} from "./coupon.controller.js";
import { Coupon } from "./coupon.model.js";

export const publicRouter = Router();
publicRouter.post("/validate", authenticate, validate(validateCouponSchema), validateCoupon);

export const adminRouter = Router();
adminRouter.get("/", validate(listCouponsQuerySchema), listCouponsAdmin);
adminRouter.post("/", validate(createCouponSchema), auditLog("Coupon"), createCouponAdmin);
adminRouter.get("/:id", validate(idParamSchema), getCouponAdmin);
adminRouter.patch("/:id", validate(updateCouponSchema), auditLog("Coupon", Coupon), updateCouponAdmin);
adminRouter.delete("/:id", validate(idParamSchema), auditLog("Coupon", Coupon), deleteCouponAdmin);
