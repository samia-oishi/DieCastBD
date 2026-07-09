import { z } from "zod";

export const validateCouponSchema = {
  body: z.object({
    code: z.string().min(1, "Coupon code is required"),
    subtotal: z.coerce.number().min(0),
  }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().min(1) }),
};

export const listCouponsQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    q: z.string().optional(),
  }),
};

export const createCouponSchema = {
  body: z.object({
    code: z.string().min(1, "Code is required"),
    type: z.enum(["percentage", "fixed"]),
    value: z.coerce.number().positive("Value must be greater than 0"),
    minOrderValue: z.coerce.number().min(0).optional(),
    maxDiscount: z.coerce.number().positive().optional().nullable(),
    usageLimit: z.coerce.number().int().positive().optional().nullable(),
    expiresAt: z.coerce.date().optional().nullable(),
  }),
};

export const updateCouponSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    type: z.enum(["percentage", "fixed"]).optional(),
    value: z.coerce.number().positive().optional(),
    minOrderValue: z.coerce.number().min(0).optional(),
    maxDiscount: z.coerce.number().positive().optional().nullable(),
    usageLimit: z.coerce.number().int().positive().optional().nullable(),
    expiresAt: z.coerce.date().optional().nullable(),
    isActive: z.coerce.boolean().optional(),
  }),
};
