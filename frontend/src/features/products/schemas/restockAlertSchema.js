import { z } from "zod";

// Mirrors backend/src/modules/restockAlerts/contactType.js exactly — kept in
// sync by hand since frontend/backend don't share a validation package.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BD_PHONE_RE = /^(?:\+?880|0)1[3-9]\d{8}$/;

export const restockAlertSchema = z.object({
  contact: z
    .string()
    .trim()
    .min(1, "Enter a phone number or email")
    .refine((value) => EMAIL_RE.test(value) || BD_PHONE_RE.test(value), {
      message: "Enter a valid phone number or email",
    }),
});
