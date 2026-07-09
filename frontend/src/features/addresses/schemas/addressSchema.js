import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().optional().or(z.literal("")),
  recipientName: z.string().min(1, "Recipient name is required"),
  phone: z.string().min(1, "Phone is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional().or(z.literal("")),
  city: z.string().min(1, "City is required"),
  district: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
});
