import { z } from "zod";

export const checkoutSchema = z.object({
  phone: z.string().min(1, "Phone is required"),
  deliveryNote: z.string().optional().or(z.literal("")),
  paymentMethod: z.enum(["cod", "bkash"]),
  shippingZone: z.string().min(1, "Please select a shipping zone"),
});
