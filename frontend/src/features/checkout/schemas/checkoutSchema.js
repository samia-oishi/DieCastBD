import { z } from "zod";

// Phone is sourced from the shipping address (guest form or saved address), not
// a separate field, so it's added to the order payload directly — not here.
export const checkoutSchema = z
  .object({
    deliveryNote: z.string().optional().or(z.literal("")),
    paymentMethod: z.enum(["cod", "bkash", "banglaqr"]),
    // Business payment option (cod/deliveryOnly/partialAdvance/full) — orthogonal
    // to paymentMethod (the payment channel). Client-side preview mirror only;
    // the backend re-validates and computes the authoritative amounts.
    paymentOption: z.enum(["cod", "deliveryOnly", "partialAdvance", "full"]).optional().default("cod"),
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
  })
  .refine((data) => data.paymentOption === "cod" || data.paymentMethod !== "cod", {
    message: "This payment option requires paying via bKash or BanglaQR, not Cash on Delivery",
    path: ["paymentMethod"],
  });
