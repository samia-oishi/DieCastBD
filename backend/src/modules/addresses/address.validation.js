import { z } from "zod";

export const createAddressSchema = {
  body: z.object({
    label: z.string().optional(),
    recipientName: z.string().min(1, "Recipient name is required"),
    phone: z.string().min(1, "Phone is required"),
    addressLine1: z.string().min(1, "Address is required"),
    addressLine2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    district: z.string().optional(),
    postalCode: z.string().optional(),
    isDefault: z.coerce.boolean().optional(),
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
    city: z.string().min(1).optional(),
    district: z.string().optional(),
    postalCode: z.string().optional(),
    isDefault: z.coerce.boolean().optional(),
  }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().min(1) }),
};
