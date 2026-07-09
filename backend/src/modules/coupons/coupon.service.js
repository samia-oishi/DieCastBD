import { Coupon } from "./coupon.model.js";
import { ApiError } from "../../utils/apiError.js";

/** Shared by both POST /coupons/validate (preview) and order creation
 * (authoritative) so the discount math can never drift between the two. */
export async function findValidCoupon(code) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw ApiError.notFound("Invalid coupon code");
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw ApiError.badRequest("This coupon has expired");
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest("This coupon has reached its usage limit");
  }
  return coupon;
}

export function calculateDiscount(coupon, subtotal) {
  if (subtotal < coupon.minOrderValue) {
    throw ApiError.badRequest(`This coupon requires a minimum order of ৳${coupon.minOrderValue}`);
  }

  let discount = coupon.type === "percentage" ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal);

  return Math.round(discount);
}
