import { z } from "zod";

const LAST_4 = /^\d{4}$/;

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
  // Both manual-payment fields now hold the LAST 4 DIGITS of the number/account the
  // customer paid from (the merchant matches that against their bKash/bank statement),
  // not a transaction ID — so validate the shape, otherwise the label lies. The DB
  // field names are unchanged: they're the stored payment reference either way.
  .refine((data) => data.paymentMethod !== "bkash" || LAST_4.test(data.bkashTransactionId?.trim() ?? ""), {
    message: "Enter the last 4 digits of the bKash number you paid from",
    path: ["bkashTransactionId"],
  })
  .refine((data) => data.paymentMethod !== "banglaqr" || LAST_4.test(data.banglaQrReference?.trim() ?? ""), {
    message: "Enter the last 4 digits of the account you paid from",
    path: ["banglaQrReference"],
  })
  .refine((data) => data.paymentOption === "cod" || data.paymentMethod !== "cod", {
    message: "This payment option requires paying via bKash or BanglaQR, not Cash on Delivery",
    path: ["paymentMethod"],
  });
