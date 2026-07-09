import { z } from "zod";

export const contactSchema = {
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    message: z.string().min(10, "Message must be at least 10 characters"),
  }),
};
