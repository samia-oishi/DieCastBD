import { z } from "zod";

export const createOrderSchema = {
  body: z.object({
    addressId: z.string().min(1, "Shipping address is required"),
    phone: z.string().min(1, "Phone is required"),
    deliveryNote: z.string().optional(),
    couponCode: z.string().optional(),
    paymentMethod: z.enum(["cod", "bkash"]),
  }),
};

export const orderNumberParamSchema = {
  params: z.object({ orderNumber: z.string().min(1) }),
};

export const listOrdersQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    status: z
      .enum(["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"])
      .optional(),
    q: z.string().optional(), // matches orderNumber
  }),
};

export const updateStatusSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    status: z.enum(["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"]),
    note: z.string().optional(),
    trackingNumber: z.string().optional(),
    courierName: z.string().optional(),
  }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().min(1) }),
};
