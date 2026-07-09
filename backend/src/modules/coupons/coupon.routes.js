import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { validateCouponSchema } from "./coupon.validation.js";
import { validateCoupon } from "./coupon.controller.js";

const router = Router();
router.post("/validate", authenticate, validate(validateCouponSchema), validateCoupon);

export default router;
