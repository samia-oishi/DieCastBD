import { z } from "zod";

const shippingAddressBodySchema = z.object({
  recipientName: z.string().min(1, "Recipient name is required"),
  phone: z.string().min(1, "Phone is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  district: z.string().optional(),
  postalCode: z.string().optional(),
});

// Every combination of fields here is valid Zod-wise; which combination is
// actually required depends on auth state (logged in + addressId vs. logged in
// + Buy Now items vs. guest + shippingAddress/guestInfo) — that cross-field,
// auth-aware branching happens in the controller, not here, since validate()
// has no access to req.user.
export const createOrderSchema = {
  body: z.object({
    addressId: z.string().optional(),
    items: z
      .array(z.object({ productId: z.string().min(1), qty: z.coerce.number().int().min(1) }))
      .optional(),
    guestInfo: z
      .object({
        name: z.string().min(1, "Name is required"),
        phone: z.string().min(1, "Phone is required"),
        email: z.string().email("Enter a valid email").optional().or(z.literal("")),
      })
      .optional(),
    shippingAddress: shippingAddressBodySchema.optional(),

    phone: z.string().min(1, "Phone is required"),
    deliveryNote: z.string().optional(),
    couponCode: z.string().optional(),
    paymentMethod: z.enum(["cod", "bkash"]),
    shippingZone: z.string().min(1, "Shipping zone is required"),
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
