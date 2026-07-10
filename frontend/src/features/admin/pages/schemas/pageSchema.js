import { z } from "zod";

export const pageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
  isPublished: z.boolean(),
});
