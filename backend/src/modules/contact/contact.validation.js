import { z } from "zod";
import { isEmail, isBdPhone } from "../restockAlerts/contactType.js";

export const contactSchema = {
  body: z.object({
    name: z.string().min(1, "Name is required"),
    // "Email or phone" per the contact form — accept either shape so a customer
    // can reach us however they prefer. replyTo is only wired for email-shaped
    // contacts (no SMS provider), same rule as restock alerts.
    contact: z
      .string()
      .min(1, "Email or phone is required")
      .refine((v) => isEmail(v) || isBdPhone(v), "Enter a valid email or phone"),
    orderId: z.string().optional().or(z.literal("")),
    message: z.string().min(10, "Message must be at least 10 characters"),
  }),
};
