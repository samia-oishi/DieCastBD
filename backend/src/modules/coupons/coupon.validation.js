import { z } from "zod";

export const validateCouponSchema = {
  body: z.object({
    code: z.string().min(1, "Coupon code is required"),
    subtotal: z.coerce.number().min(0),
  }),
};
