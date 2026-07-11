import { z } from "zod";

// Bangladeshi mobile number: 11 digits, 01[3-9] prefix (e.g. 01712345678).
// Single source of truth — imported by checkout, address, contact, and restock
// schemas so the rule can't drift between forms.
export const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

export const bdPhoneSchema = z
  .string()
  .trim()
  .regex(BD_PHONE_REGEX, "Enter a valid Bangladeshi number (e.g. 01712345678)");

export function isBdPhone(value) {
  return BD_PHONE_REGEX.test((value ?? "").trim());
}

export function isEmail(value) {
  return z.string().email().safeParse((value ?? "").trim()).success;
}

// Restock alert "Phone or email" field — accepts either a BD phone or an email,
// mirroring the backend's contactType.js either/or rule.
export const phoneOrEmailSchema = z
  .string()
  .trim()
  .min(1, "Enter your phone or email")
  .refine((v) => isBdPhone(v) || isEmail(v), "Enter a valid phone (01…) or email");
