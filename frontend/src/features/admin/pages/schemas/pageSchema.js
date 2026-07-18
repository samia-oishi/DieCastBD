import { z } from "zod";

export const pageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  // Blocks are shaped and validated by the API (page.blocks.js); the admin form
  // just needs them to survive validation rather than re-describing all eight.
  blocks: z.array(z.record(z.string(), z.any())).optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
  isPublished: z.boolean(),
});
