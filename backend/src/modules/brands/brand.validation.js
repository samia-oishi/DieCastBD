import { z } from "zod";

const landingFaqs = z
  .array(z.object({ question: z.string().min(1).max(300), answer: z.string().min(1).max(2000) }))
  .max(15);

export const createBrandSchema = {
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    content: z.string().max(20000).optional(),
    faqs: landingFaqs.optional(),
    sortOrder: z.coerce.number().optional(),
  }),
};

export const updateBrandSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    content: z.string().max(20000).optional(),
    faqs: landingFaqs.optional(),
    isActive: z.coerce.boolean().optional(),
    sortOrder: z.coerce.number().optional(),
  }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().min(1) }),
};

/** The full list in its new order. Capped well above any realistic catalogue so
 * a malformed client can't ask for an unbounded bulkWrite. */
export const reorderSchema = {
  body: z.object({ ids: z.array(z.string().min(1)).min(1).max(500) }),
};
