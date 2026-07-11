import { z } from "zod";

const seo = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  canonicalUrl: z.string().optional(),
});

export const createPageSchema = {
  body: z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().optional(),
    tldr: z.string().optional(),
    seo: seo.optional(),
    isPublished: z.coerce.boolean().optional(),
  }),
};

export const updatePageSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).optional(),
    content: z.string().optional(),
    tldr: z.string().optional(),
    seo: seo.optional(),
    isPublished: z.coerce.boolean().optional(),
  }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().min(1) }),
};

export const slugParamSchema = {
  params: z.object({ slug: z.string().min(1) }),
};
