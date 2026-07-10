import { z } from "zod";

export const checkoutSchema = z
  .object({
    phone: z.string().min(1, "Phone is required"),
    deliveryNote: z.string().optional().or(z.literal("")),
    paymentMethod: z.enum(["cod", "bkash"]),
    bkashTransactionId: z.string().optional().or(z.literal("")),
    shippingZone: z.string().min(1, "Please select a shipping zone"),
  })
  .refine((data) => data.paymentMethod !== "bkash" || !!data.bkashTransactionId?.trim(), {
    message: "bKash Transaction ID is required",
    path: ["bkashTransactionId"],
  });
