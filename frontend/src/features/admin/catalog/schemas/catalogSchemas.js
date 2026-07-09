import { z } from "zod";

export const catalogItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().optional(),
});
