import { Coupon } from "./coupon.model.js";
import { findValidCoupon, calculateDiscount } from "./coupon.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
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

export const listCouponsAdmin = asyncHandler(async (req, res) => {
  const { page, limit, q } = req.query;
  const filter = q ? { code: { $regex: q.trim(), $options: "i" } } : {};

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Coupon.countDocuments(filter),
  ]);

  sendSuccess(res, { data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

export const getCouponAdmin = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw ApiError.notFound("Coupon not found");
  sendSuccess(res, { data: coupon });
});

export const createCouponAdmin = asyncHandler(async (req, res) => {
  const code = req.body.code.toUpperCase().trim();
  if (await Coupon.exists({ code })) {
    throw ApiError.conflict("A coupon with this code already exists");
  }

  const coupon = await Coupon.create({ ...req.body, code });
  sendSuccess(res, { data: coupon, status: 201, message: "Coupon created" });
});

// `code` is deliberately not editable here — once a coupon is distributed, changing
// its code would break every customer who already has it. Deactivate and create a
// new one instead.
export const updateCouponAdmin = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!coupon) throw ApiError.notFound("Coupon not found");
  sendSuccess(res, { data: coupon, message: "Coupon updated" });
});

export const deleteCouponAdmin = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw ApiError.notFound("Coupon not found");
  if (coupon.usedCount > 0) {
    throw ApiError.conflict("Cannot delete a coupon that's already been used — deactivate it instead");
  }

  await coupon.deleteOne();
  sendSuccess(res, { message: "Coupon deleted" });
});
