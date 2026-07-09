import { z } from "zod";

export const subscribeSchema = {
  body: z.object({
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
  }),
};
