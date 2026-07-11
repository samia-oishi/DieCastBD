import { z } from "zod";

// Phone is sourced from the shipping address (guest form or saved address), not
// a separate field, so it's added to the order payload directly — not here.
export const checkoutSchema = z
  .object({
    deliveryNote: z.string().optional().or(z.literal("")),
    paymentMethod: z.enum(["cod", "bkash", "banglaqr"]),
    bkashTransactionId: z.string().optional().or(z.literal("")),
    banglaQrReference: z.string().optional().or(z.literal("")),
    shippingZone: z.string().min(1, "Please select a delivery zone"),
  })
  .refine((data) => data.paymentMethod !== "bkash" || !!data.bkashTransactionId?.trim(), {
    message: "bKash Transaction ID is required",
    path: ["bkashTransactionId"],
  })
  .refine((data) => data.paymentMethod !== "banglaqr" || !!data.banglaQrReference?.trim(), {
    message: "Payment reference is required",
    path: ["banglaQrReference"],
  });
