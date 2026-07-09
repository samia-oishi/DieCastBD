import { z } from "zod";

export const updateProfileSchema = {
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z.union([z.string().min(1), z.literal("")]).optional(),
    photoURL: z.string().url().optional(),
  }),
};
