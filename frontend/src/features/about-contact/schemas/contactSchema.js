import { z } from "zod";
import { phoneOrEmailSchema } from "@/lib/validators";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: phoneOrEmailSchema,
  orderId: z.string().optional().or(z.literal("")),
  message: z.string().min(10, "Message must be at least 10 characters"),
});
