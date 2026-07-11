import { z } from "zod";
import { phoneOrEmailSchema } from "@/lib/validators";

// Mirrors the backend's either/or contact rule (contactType.js). Kept in sync by
// hand since frontend/backend don't share a validation package.
export const restockAlertSchema = z.object({
  contact: phoneOrEmailSchema,
});
