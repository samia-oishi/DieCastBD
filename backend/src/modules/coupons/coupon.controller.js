import { findValidCoupon, calculateDiscount } from "./coupon.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const coupon = await findValidCoupon(code);
  const discount = calculateDiscount(coupon, subtotal);

  sendSuccess(res, {
    data: { code: coupon.code, type: coupon.type, value: coupon.value, discount },
    message: "Coupon applied",
  });
});
