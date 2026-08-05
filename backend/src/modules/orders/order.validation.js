import { z } from "zod";

// Deliberately looser than the checkout form, which requires both dropdowns.
// A browser tab opened before the district/thana switch still posts the old
// {city, postalCode} shape, and rejecting those would lose real orders in the
// window after a deploy. The refine is the floor that actually matters: an
// address with no area at all can't be delivered.
const shippingAddressBodySchema = z
  .object({
    recipientName: z.string().min(1, "Recipient name is required"),
    phone: z.string().min(1, "Phone is required"),
    addressLine1: z.string().min(1, "Address is required"),
    addressLine2: z.string().optional(),
    district: z.string().optional(),
    thana: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
  })
  .refine((a) => Boolean(a.thana?.trim() || a.city?.trim()), {
    message: "Select your thana",
    path: ["thana"],
  });

// Every combination of fields here is valid Zod-wise; which combination is
// actually required depends on auth state (logged in + addressId vs. logged in
// + Buy Now items vs. guest + shippingAddress/guestInfo) — that cross-field,
// auth-aware branching happens in the controller, not here, since validate()
// has no access to req.user.
export const createOrderSchema = {
  body: z
    .object({
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
      paymentMethod: z.enum(["cod", "bkash", "banglaqr"]),
      // Business payment option (System: pre-order/payment-options requirement) —
      // orthogonal to paymentMethod above. Defaults to "cod" so existing/unaware
      // frontend builds that don't send this field keep behaving exactly as
      // before (full COD, nothing collected upfront).
      paymentOption: z.enum(["cod", "deliveryOnly", "partialAdvance", "full"]).optional().default("cod"),
      bkashTransactionId: z.string().optional(),
      banglaQrReference: z.string().optional(),
      shippingZone: z.string().min(1, "Shipping zone is required"),
    })
    // Manual bKash/BanglaQR flows — the customer pays outside the app and types a
    // reference here; only required when they actually chose that method. As of the
    // checkout redesign that reference is the LAST 4 DIGITS of the number/account they
    // paid from (the merchant matches it against their statement), which is why the
    // messages say so. Deliberately still just "non-empty" here rather than a strict
    // 4-digit rule: the shape is a presentation concern the client owns, and these
    // columns also hold older orders' free-form transaction IDs.
    .refine((data) => data.paymentMethod !== "bkash" || !!data.bkashTransactionId?.trim(), {
      message: "The last 4 digits of your bKash number are required",
      path: ["bkashTransactionId"],
    })
    .refine((data) => data.paymentMethod !== "banglaqr" || !!data.banglaQrReference?.trim(), {
      message: "The last 4 digits of your account number are required",
      path: ["banglaQrReference"],
    })
    // Any paymentOption other than "cod" collects money upfront via the manual
    // bKash/BanglaQR proof flow — Cash on Delivery has no mechanism to collect
    // a delivery-only/advance/full amount before the courier hands over the
    // parcel, so it can't be paired with those options.
    .refine((data) => data.paymentOption === "cod" || data.paymentMethod !== "cod", {
      message: "This payment option requires paying via bKash or BanglaQR, not Cash on Delivery",
      path: ["paymentMethod"],
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

// Bulk delete. Capped at 100 per call: the whole batch runs in one MongoDB
// transaction, and an unbounded list would let a single request hold a very
// long-running transaction open.
export const deleteOrdersSchema = {
  body: z.object({
    ids: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order id"))
      .min(1, "Select at least one order to delete")
      .max(100, "You can delete at most 100 orders at a time"),
  }),
};
