import { z } from "zod";

const numericOrEmpty = z.union([z.coerce.number().positive(), z.literal("")]).optional();

export const couponFormSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters"),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().positive("Value must be greater than 0"),
  minOrderValue: z.coerce.number().min(0).optional(),
  maxDiscount: numericOrEmpty,
  usageLimit: numericOrEmpty,
  expiresAt: z.string().optional(),
});
