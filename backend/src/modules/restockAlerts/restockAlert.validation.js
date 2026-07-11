import { z } from "zod";
import { isEmail, isBdPhone } from "./contactType.js";

export const createRestockAlertSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    contact: z
      .string()
      .trim()
      .min(1, "Enter a phone number or email")
      .refine((value) => isEmail(value) || isBdPhone(value), {
        message: "Enter a valid phone number or email",
      }),
  }),
};

export const listRestockAlertsSchema = {
  params: z.object({ id: z.string().min(1) }),
};
