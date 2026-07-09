import { z } from "zod";

export const addItemSchema = {
  body: z.object({
    productId: z.string().min(1),
    qty: z.coerce.number().int().min(1).default(1),
  }),
};

export const updateItemSchema = {
  params: z.object({ productId: z.string().min(1) }),
  body: z.object({
    qty: z.coerce.number().int().min(1),
  }),
};

export const productIdParamSchema = {
  params: z.object({ productId: z.string().min(1) }),
};

export const mergeCartSchema = {
  body: z.object({
    items: z.array(
      z.object({
        productId: z.string().min(1),
        qty: z.coerce.number().int().min(1),
      })
    ),
  }),
};
