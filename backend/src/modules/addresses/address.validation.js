import { z } from "zod";

export const createAddressSchema = {
  body: z.object({
    label: z.string().optional(),
    recipientName: z.string().min(1, "Recipient name is required"),
    phone: z.string().min(1, "Phone is required"),
    addressLine1: z.string().min(1, "Address is required"),
    addressLine2: z.string().optional(),
    district: z.string().optional(),
    thana: z.string().optional(),
    // See the note on order.validation.js — old clients post {city, postalCode}.
    city: z.string().optional(),
    postalCode: z.string().optional(),
    isDefault: z.coerce.boolean().optional(),
  })
    .refine((a) => Boolean(a.thana?.trim() || a.city?.trim()), {
      message: "Select your thana",
      path: ["thana"],
    }),
};

export const updateAddressSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    label: z.string().optional(),
    recipientName: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    addressLine1: z.string().min(1).optional(),
    addressLine2: z.string().optional(),
    district: z.string().optional(),
    thana: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    isDefault: z.coerce.boolean().optional(),
  }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().min(1) }),
};
