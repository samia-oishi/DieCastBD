import { z } from "zod";

const landingFaqs = z
  .array(z.object({ question: z.string().min(1).max(300), answer: z.string().min(1).max(2000) }))
  .max(15);

export const createCategorySchema = {
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    content: z.string().max(20000).optional(),
    faqs: landingFaqs.optional(),
    parentCategory: z.string().optional(),
    sortOrder: z.coerce.number().optional(),
  }),
};

export const updateCategorySchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    content: z.string().max(20000).optional(),
    faqs: landingFaqs.optional(),
    parentCategory: z.string().nullable().optional(),
    isActive: z.coerce.boolean().optional(),
    sortOrder: z.coerce.number().optional(),
  }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().min(1) }),
};
