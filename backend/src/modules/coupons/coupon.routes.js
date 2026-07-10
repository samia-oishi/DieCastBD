import { Router } from "express";
import { optionalAuthenticate } from "../../middlewares/optionalAuthenticate.js";
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
// Guests can apply coupons at checkout too — the controller doesn't read
// req.user at all, so this is purely about not blocking unauthenticated callers.
publicRouter.post("/validate", optionalAuthenticate, validate(validateCouponSchema), validateCoupon);

export const adminRouter = Router();
adminRouter.get("/", validate(listCouponsQuerySchema), listCouponsAdmin);
adminRouter.post("/", validate(createCouponSchema), auditLog("Coupon"), createCouponAdmin);
adminRouter.get("/:id", validate(idParamSchema), getCouponAdmin);
adminRouter.patch("/:id", validate(updateCouponSchema), auditLog("Coupon", Coupon), updateCouponAdmin);
adminRouter.delete("/:id", validate(idParamSchema), auditLog("Coupon", Coupon), deleteCouponAdmin);
