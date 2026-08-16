import { z } from "zod";

export const catalogItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().optional(),
  // Landing-page depth (mirrors the backend brand/category schemas): rich text
  // rendered below the product grid, and real Q&As. Both optional — the
  // sections simply don't exist on the storefront until filled in.
  content: z.string().max(20000, "Keep landing content under 20,000 characters").optional().or(z.literal("")),
  faqs: z
    .array(
      z.object({
        question: z.string().min(1, "Question is required").max(300),
        answer: z.string().min(1, "Answer is required").max(2000),
      })
    )
    .max(15)
    .optional(),
});
