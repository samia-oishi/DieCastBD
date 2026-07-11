import { z } from "zod";

export const createRestockAlertSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    email: z.string().email("Enter a valid email"),
  }),
};
