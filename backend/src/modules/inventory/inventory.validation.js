import { z } from "zod";

export const listInventoryQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    q: z.string().optional(),
    lowStockOnly: z.coerce.boolean().optional(),
    hasAlerts: z.coerce.boolean().optional(),
  }),
};

export const productIdParamSchema = {
  params: z.object({ id: z.string().min(1) }),
};

export const adjustStockSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    type: z.enum(["restock", "adjustment"]),
    quantityChange: z.coerce.number().int().refine((v) => v !== 0, "Quantity change cannot be zero"),
    reason: z.string().min(1, "A reason is required"),
  }),
};
